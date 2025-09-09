# backend/controllers/main_controller.py
from fastapi import HTTPException
from models.main_model import MainPageContent

# Dummy content for now
MAIN_CONTENT = {
    "home": "Welcome to CampusBuzz!",
    "events": "Check latest events here.",
    "blogs": "Read our latest blogs.",
    "contact": "Email: campusbuzz@college.edu",
    "address": "123 College Street, City, Country"
}

async def get_main_content():
    return MAIN_CONTENT
