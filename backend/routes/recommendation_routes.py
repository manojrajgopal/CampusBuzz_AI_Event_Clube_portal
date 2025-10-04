from fastapi import APIRouter, Depends, HTTPException
from config.db import db
import google.generativeai as genai
import os
from utils.id_util import normalize_id

router = APIRouter(prefix="/api/recommendations", tags=["recommendations"])

# Configure Gemini
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

async def get_student_profile(USN_id: str):
    student = await db.users.find_one({"_id": normalize_id(USN_id), "role": "student"})
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    return student

async def fetch_context():
    clubs = await db.clubs.find({"approved": True}).to_list(100)
    events = await db.events.find({}).to_list(100)
    return clubs, events

@router.get("/clubs/{USN_id}")
async def recommend_clubs(USN_id: str):
    student = await get_student_profile(USN_id)
    clubs, events = await fetch_context()

    # Prepare context for Gemini
    prompt = f"""
    You are an AI advisor. Suggest the best clubs for this student.
    Student Profile: {student}
    Clubs Available: {clubs}
    Respond with a short explanation.
    """

    model = genai.GenerativeModel("gemini-pro")
    response = model.generate_content(prompt)
    text = response.text if hasattr(response, "text") else "No recommendation found."

    return {"recommendations": text}

@router.get("/events/{USN_id}")
async def recommend_events(USN_id: str):
    student = await get_student_profile(USN_id)
    clubs, events = await fetch_context()

    prompt = f"""
    You are an AI event recommender. Suggest suitable events for this student.
    Student Profile: {student}
    Events Available: {events}
    Respond with a short explanation.
    """

    model = genai.GenerativeModel("gemini-pro")
    response = model.generate_content(prompt)
    text = response.text if hasattr(response, "text") else "No recommendation found."

    return {"recommendations": text}
