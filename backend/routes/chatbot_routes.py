from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from config.db import db
import google.generativeai as genai
import os
from datetime import datetime
from utils.id_util import normalize_id

router = APIRouter(prefix="/api/chatbot", tags=["chatbot"])

# 🔑 Gemini API setup
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

# ----------------- Models -----------------
class ChatRequest(BaseModel):
    user_id: str
    question: str

class ChatResponse(BaseModel):
    answer: str

# ----------------- Helpers -----------------
async def fetch_context_from_db():
    context = {}

    clubs = await db.clubs.find({}).to_list(100)
    context["clubs"] = [{"name": c.get("name"), "description": c.get("description","")} for c in clubs]

    events = await db.events.find({}).to_list(100)
    context["events"] = [{"title": e.get("title"), "date": e.get("date")} for e in events]

    teachers = await db.teachers.find({}).to_list(100)
    context["teachers"] = [{"name": t.get("name"), "email": t.get("email")} for t in teachers]

    students = await db.users.find({"role":"student"}).to_list(100)
    context["students"] = [{"name": s.get("name"), "email": s.get("email")} for s in students]

    return context

async def log_chat(user_id, question, answer):
    await db.chat_logs.insert_one({
        "user_id": normalize_id(user_id),
        "question": question,
        "answer": answer,
        "timestamp": datetime.utcnow()
    })

def extract_gemini_text(response):
    """
    Safely extract text from Gemini response, works across SDK versions
    """
    try:
        if not response.candidates:
            return None
        candidate = response.candidates[0]
        content = getattr(candidate, "content", None)

        if isinstance(content, list) and len(content) > 0:
            if hasattr(content[0], "text"):
                return content[0].text.strip()
            if hasattr(content[0], "message") and hasattr(content[0].message, "text"):
                return content[0].message.text.strip()
            if hasattr(content[0], "parts") and len(content[0].parts) > 0:
                return content[0].parts[0].text.strip()
        elif content:
            if hasattr(content, "text"):
                return content.text.strip()
            if hasattr(content, "message") and hasattr(content.message, "text"):
                return content.message.text.strip()
        return None
    except Exception as e:
        print("Error extracting Gemini text:", e)
        return None

# ----------------- Chatbot Route -----------------
@router.post("/query", response_model=ChatResponse)
async def query_chatbot(request: ChatRequest):
    try:
        # 1. Gather context
        context = await fetch_context_from_db()

        # 2. Prepare prompt
        prompt = f"""
You are a helpful AI chatbot for a University Club & Event Management system.
Answer in human-like language. Use the provided database context when possible.

User Question: {request.question}

Database Context:
Clubs: {context['clubs']}
Events: {context['events']}
Teachers: {context['teachers']}
Students: {context['students']}

If the answer is in the DB, use it. Otherwise answer generally.
"""

        # 3. Call Gemini asynchronously
        model = genai.GenerativeModel("gemini-2.0-flash")
        response = await model.generate_content_async(prompt)

        answer = extract_gemini_text(response) or "Sorry, I couldn't find an answer."

        # 4. Log chat
        await log_chat(request.user_id, request.question, answer)

        return {"answer": answer}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Chatbot error: {str(e)}")
