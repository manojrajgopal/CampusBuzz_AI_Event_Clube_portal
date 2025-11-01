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
    return {
        "clubs": await db.clubs.find({}, {"_id": 0, "name": 1, "description": 1, "faculty_incharge": 1, "members_count": 1}).to_list(100),
        "events": await db.events.find({}, {"_id": 0, "title": 1, "date": 1, "location": 1, "organizer": 1}).to_list(100),
        "teachers": await db.teachers.find({}, {"_id": 0, "name": 1, "department": 1, "email": 1, "phone": 1}).to_list(100),
        "students": await db.users.find({"role": "student"}, {"_id": 0, "name": 1, "roll_no": 1, "year": 1, "email": 1}).to_list(100),
    }

async def fetch_user_history(user_id: str, limit: int = 20) -> list:
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
        # 1. Fetch structured context & user history
        context = await fetch_context_from_db()
        history = await fetch_user_history(request.user_id)

        # 2. Prepare history string for AI
        history_str = ""
        for h in reversed(history):
            history_str += f"User asked: {h['question']}\nAI answered: {h['response'].get('message', '')}\n"

        # 3. Build prompt
        prompt = f"""
You are a professional AI assistant for a University Club & Event Management system.
- Before answering, analyze the user's previous chat history to see if the question is related.
- Always answer in a Q&A style if relevant, else answer generally.
- Respond in strict JSON only:

JSON structure:
{{
  "message": "friendly answer with emojis",
  "events": dict | null,
  "clubs": dict | null,
  "teachers": dict | null,
  "students": dict | null
}}

Include only relevant arrays for the user question. For general greetings, only include "message".

Database Context:
Clubs: {context['clubs']}
Events: {context['events']}
Teachers: {context['teachers']}
Students: {context['students']}

User History:
{history_str}

User Question: {request.question}
"""

        # 4. Call Gemini AI
        model = genai.GenerativeModel("gemini-2.0-flash")
        response = await model.generate_content_async(prompt)

        # 5. Extract and clean message
        raw_message = extract_gemini_text(response) or "Sorry, I couldn't find an answer."
        message = clean_message(raw_message)

        # 6. Build structured response
        response_json = {"message": message}

        q_lower = request.question.lower()
        # Determine relevance to structured data
        if any(keyword in q_lower for keyword in ["event", "date", "location", "organizer"]):
            response_json["events"] = {e["title"]: [e] for e in context["events"]}
        if any(keyword in q_lower for keyword in ["club", "society"]):
            response_json["clubs"] = {c["name"]: [c] for c in context["clubs"]}
        if any(keyword in q_lower for keyword in ["teacher", "faculty", "professor"]):
            response_json["teachers"] = {t["name"]: [t] for t in context["teachers"]}
        if any(keyword in q_lower for keyword in ["student", "roll", "year"]):
            response_json["students"] = {s["name"]: [s] for s in context["students"]}

        # 7. Log chat
        await log_chat(request.user_id, request.question, response_json)

        return response_json

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Chatbot error: {str(e)}")

# Backward compatibility alias
@router.post("/ask", response_model=ChatResponse)
async def ask_chatbot(request: ChatRequest):
    return await query_chatbot(request)
