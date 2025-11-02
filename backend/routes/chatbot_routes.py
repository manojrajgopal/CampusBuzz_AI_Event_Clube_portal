# routes/chatbot_routes.py
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from config.db import db
import google.generativeai as genai
import os
from datetime import datetime
from utils.id_util import normalize_id
import json
import re
from bson import ObjectId

router = APIRouter(prefix="/api/chatbot", tags=["chatbot"])

# 🔑 Gemini API setup
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

# ----------------- Models -----------------
class ChatRequest(BaseModel):
    user_id: str
    question: str

class ChatResponse(BaseModel):
    message: str
    events: dict | None = None
    clubs: dict | None = None
    teachers: dict | None = None
    students: dict | None = None

# ----------------- Helpers -----------------
async def fetch_context_from_db() -> dict:
    """Fetch structured university data for responses."""
    clubs = await db.clubs.find({}, {"_id": 0, "name": 1, "description": 1, "faculty_incharge": 1, "members_count": 1}).to_list(10)
    # Remove image_base64 if present
    for club in clubs:
        club.pop("image_base64", None)

    return {
        "clubs": clubs,
        "events": await db.events.find({}, {"_id": 0, "title": 1, "date": 1, "venue": 1, "clubName": 1}).to_list(10),
        "teachers": await db.teachers.find({}, {"_id": 0, "name": 1, "department": 1, "email": 1, "phone": 1}).to_list(10),
        "students": await db.users.find({"role": "student"}, {"_id": 0, "name": 1, "roll_no": 1, "year": 1, "email": 1}).to_list(10),
    }

def serialize_mongo_doc(doc: dict) -> dict:
    """Convert MongoDB document to JSON-serializable dict."""
    if not doc:
        return doc
    result = {}
    for k, v in doc.items():
        if k == "_id":
            continue
        if isinstance(v, ObjectId):
            result[k] = str(v)
        elif isinstance(v, datetime):
            result[k] = v.isoformat()
        elif isinstance(v, dict):
            result[k] = serialize_mongo_doc(v)
        elif isinstance(v, list):
            result[k] = [serialize_mongo_doc(item) if isinstance(item, dict) else (str(item) if isinstance(item, ObjectId) else (item.isoformat() if isinstance(item, datetime) else item)) for item in v]
        else:
            result[k] = v
    return result

async def fetch_club_details(club_name: str) -> dict | None:
    """Fetch detailed club data by name."""
    club = await db.clubs.find_one({"name": {"$regex": club_name, "$options": "i"}})
    if club:
        # Remove image_base64 if present
        club.pop("image_base64", None)
        # Fetch associated teachers
        teachers = await db.teachers.find({"club_id": club["_id"]}, {"_id": 0}).to_list(10)
        club_details = serialize_mongo_doc(club)
        club_details["teachers"] = [serialize_mongo_doc(t) for t in teachers]
        return club_details
    return None

async def fetch_event_details(event_title: str) -> dict | None:
    """Fetch detailed event data by title and associated club."""
    event = await db.events.find_one({"title": {"$regex": event_title, "$options": "i"}})
    if event:
        event_details = serialize_mongo_doc(event)
        # Fetch associated club if clubId exists
        if event.get("clubId"):
            club = await db.clubs.find_one({"_id": normalize_id(event["clubId"])}, {"_id": 0})
            if club:
                club.pop("image_base64", None)
            event_details["associated_club"] = serialize_mongo_doc(club)
        return event_details
    return None

def detect_specific_query(question: str, context: dict, query_type: str) -> str | None:
    """Detect if question mentions a specific club or event."""
    items = context.get(query_type + "s", [])
    question_lower = question.lower()

    # Check for exact matches first
    for item in items:
        name = item.get("name" if query_type == "club" else "title", "")
        if name and name.lower() in question_lower:
            return name

    # Check for partial matches (e.g., "IWX" in "IWX club")
    for item in items:
        name = item.get("name" if query_type == "club" else "title", "")
        if name:
            name_parts = name.lower().split()
            for part in name_parts:
                if len(part) > 2 and part in question_lower:  # Only match parts longer than 2 chars
                    return name

    return None

async def fetch_user_history(user_id: str, limit: int = 5) -> list:
    """Fetch last N messages of a user to check context and relevance."""
    logs = await db.chat_logs.find({"user_id": normalize_id(user_id)}).sort("timestamp", -1).limit(limit).to_list(limit)
    return [{"question": log["question"], "response": log["response"]} for log in logs]

async def log_chat(user_id: str, question: str, response_json: dict) -> None:
    """Store chat logs in MongoDB."""
    await db.chat_logs.insert_one({
        "user_id": normalize_id(user_id),
        "question": question,
        "response": response_json,
        "timestamp": datetime.utcnow(),
    })

def extract_gemini_text(response) -> str | None:
    """Extract plain text from Gemini response safely."""
    try:
        if hasattr(response, "text") and response.text:
            return response.text.strip()
        if hasattr(response, "candidates") and response.candidates:
            candidate = response.candidates[0]
            content = getattr(candidate, "content", None)
            if content and hasattr(content, "parts"):
                for part in content.parts:
                    if hasattr(part, "text") and part.text:
                        return part.text.strip()
        return None
    except Exception as e:
        return None

def clean_message(message: str) -> str:
    """Clean the AI response and extract message text."""
    message = re.sub(r"```json|```", "", message)
    try:
        parsed = json.loads(message)
        if isinstance(parsed, dict) and "message" in parsed:
            return parsed["message"]
    except:
        pass
    return message.strip()

# ----------------- Chatbot Route -----------------
@router.post("/query", response_model=ChatResponse)
async def query_chatbot(request: ChatRequest):
    try:
        # 1. Fetch structured context
        context = await fetch_context_from_db()

        # 2. Detect specific club or event queries
        specific_club = detect_specific_query(request.question, context, "club")
        specific_event = detect_specific_query(request.question, context, "event")

        # 3. Fetch detailed data if specific query detected (only for specific queries)
        detailed_club = None
        detailed_event = None
        if specific_club:
            detailed_club = await fetch_club_details(specific_club)
        elif specific_event:
            detailed_event = await fetch_event_details(specific_event)
        else:
            # For general queries, don't fetch detailed data to save tokens
            pass

        # 4. No history to save tokens
        history_str = ""

        # 5. Build ultra-minimal prompt to guarantee token limits
        if detailed_club:
            # For club queries - minimal prompt
            prompt = f"""You are a university chatbot. Provide details about this club: {json.dumps(detailed_club)}. Respond in JSON: {{"message": "answer"}}"""
        elif detailed_event:
            # For event queries - minimal prompt
            prompt = f"""You are a university chatbot. Provide details about this event: {json.dumps(detailed_event)}. Respond in JSON: {{"message": "answer"}}"""
        else:
            # For general queries - ultra minimal
            prompt = f"""You are a university chatbot. Answer: {request.question}. Respond in JSON: {{"message": "answer"}}"""

        # 4. Call Gemini AI
        model = genai.GenerativeModel("gemini-2.0-flash")
        response = await model.generate_content_async(prompt)

        # 5. Extract and clean message
        raw_message = extract_gemini_text(response) or "Sorry, I couldn't find an answer."
        message = clean_message(raw_message)

        # 6. Build structured response
        response_json = {"message": message}

        # Only include structured data if specifically requested or for specific queries
        q_lower = request.question.lower()
        if specific_event:
            response_json["events"] = {detailed_event["title"]: [detailed_event]} if detailed_event else {}
        elif any(keyword in q_lower for keyword in ["event", "events"]):
            response_json["events"] = {e["title"]: [e] for e in context["events"][:5]}  # Limit to 5

        if specific_club:
            response_json["clubs"] = {detailed_club["name"]: [detailed_club]} if detailed_club else {}
        elif any(keyword in q_lower for keyword in ["club", "clubs", "society"]):
            response_json["clubs"] = {c["name"]: [c] for c in context["clubs"][:5]}  # Limit to 5

        if any(keyword in q_lower for keyword in ["teacher", "teachers", "faculty", "professor"]):
            response_json["teachers"] = {t["name"]: [t] for t in context["teachers"][:5]}  # Limit to 5

        if any(keyword in q_lower for keyword in ["student", "students", "roll", "year"]):
            response_json["students"] = {s["name"]: [s] for s in context["students"][:5]}  # Limit to 5

        # 7. Log chat
        await log_chat(request.user_id, request.question, response_json)

        return response_json

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Chatbot error: {str(e)}")

# Backward compatibility alias
@router.post("/ask", response_model=ChatResponse)
async def ask_chatbot(request: ChatRequest):
    return await query_chatbot(request)
