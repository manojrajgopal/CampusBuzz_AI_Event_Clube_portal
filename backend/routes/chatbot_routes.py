from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from config.db import db
import google.generativeai as genai
import os
from datetime import datetime
from utils.id_util import normalize_id
import json
import re

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
    """Fetch relevant university data for structured responses."""
    return {
        "clubs": await db.clubs.find({}, {"_id": 0, "name": 1, "description": 1, "faculty_incharge": 1, "members_count": 1}).to_list(100),
        "events": await db.events.find({}, {"_id": 0, "title": 1, "date": 1, "location": 1, "organizer": 1}).to_list(100),
        "teachers": await db.teachers.find({}, {"_id": 0, "name": 1, "department": 1, "email": 1, "phone": 1}).to_list(100),
        "students": await db.users.find({"role": "student"}, {"_id": 0, "name": 1, "roll_no": 1, "year": 1, "email": 1}).to_list(100),
    }

async def log_chat(user_id: str, question: str, response_json: dict) -> None:
    """Store chat logs in the database."""
    await db.chat_logs.insert_one({
        "user_id": normalize_id(user_id),
        "question": question,
        "response": response_json,
        "timestamp": datetime.utcnow(),
    })

def extract_gemini_text(response) -> str | None:
    """Extract plain text from Gemini response safely across SDK versions."""
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
        print(f"⚠️ Error extracting Gemini text: {e}")
        return None

def clean_message(message: str) -> str:
    # Remove ```json and ```
    message = re.sub(r"```json|```", "", message)
    # Remove escaped quotes and newlines
    try:
        # Try parsing JSON inside message
        parsed = json.loads(message)
        if isinstance(parsed, dict) and "message" in parsed:
            return parsed["message"]
    except:
        pass
    # fallback: just strip newlines
    return message.strip()

# ----------------- Chatbot Route -----------------
@router.post("/query", response_model=ChatResponse)
async def query_chatbot(request: ChatRequest):
    """
    Main chatbot endpoint.
    Returns friendly, emoji-rich responses and structured nested JSON data.
    """
    try:
        # 1. Fetch structured context
        context = await fetch_context_from_db()

        # 2. Build prompt for Gemini
        prompt = f"""
You are a professional and friendly AI assistant for a University Club & Event Management system.
Your response should be in **strict JSON only**, containing:

1. "message": a natural, human-readable answer with emojis.
2. Nested objects for structured data:
   - "events": each key is event_name, value is an array of details (event_date, location, organizer, etc.)
   - "clubs": each key is club_name, value is an array of details (description, faculty_incharge, members_count, etc.)
   - "teachers": each key is teacher_name, value is an array of details (department, email, phone)
   - "students": each key is student_name, value is an array of details (roll_no, year, email)
3. Include arrays only relevant to the user question (e.g., if they ask about events, include "events", omit others).
4. For general greetings like "Hi", include only "message" and no arrays.
5. Always use professional, friendly language and emojis. Never include text outside the JSON.

Database Context:
Clubs: {context['clubs']}
Events: {context['events']}
Teachers: {context['teachers']}
Students: {context['students']}

User Question: {request.question}
"""

        # 3. Call Gemini AI
        model = genai.GenerativeModel("gemini-2.0-flash")
        response = await model.generate_content_async(prompt)

        # 4. Extract message
        raw_message = extract_gemini_text(response) or "Sorry, I couldn't find an answer."
        message = clean_message(raw_message)

        # 5. Build structured response for frontend
        # Start with empty dicts
        response_json = {"message": message}

        # Add arrays if question relates to them
        q_lower = request.question.lower()
        if "event" in q_lower:
            response_json["events"] = {e["title"]: [e] for e in context["events"]}
        if "club" in q_lower:
            response_json["clubs"] = {c["name"]: [c] for c in context["clubs"]}
        if "teacher" in q_lower or "faculty" in q_lower:
            response_json["teachers"] = {t["name"]: [t] for t in context["teachers"]}
        if "student" in q_lower or "roll" in q_lower:
            response_json["students"] = {s["name"]: [s] for s in context["students"]}

        # 6. Log chat with full response
        await log_chat(request.user_id, request.question, response_json)

        return response_json

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Chatbot error: {str(e)}")

# Backward compatibility alias
@router.post("/ask", response_model=ChatResponse)
async def ask_chatbot(request: ChatRequest):
    return await query_chatbot(request)
