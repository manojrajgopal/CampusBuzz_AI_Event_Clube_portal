from fastapi import APIRouter

router = APIRouter(prefix="/api/main", tags=["main"])

# ----------------- Dummy Main Page Content -----------------
MAIN_CONTENT = {
    "home": "Welcome to CampusBuzz!",
    "events": "Check latest events here.",
    "blogs": "Read our latest blogs.",
    "contact": "Email: campusbuzz@college.edu",
    "address": "123 College Street, City, Country"
}

# ----------------- Routes -----------------
@router.get("/")
async def get_main_page():
    return MAIN_CONTENT
