# backend/controllers/club_controller.py
from datetime import datetime
from fastapi import HTTPException
from bson import ObjectId
from bson.errors import InvalidId

from config.db import db
from utils.mongo_utils import sanitize_doc
from utils.id_util import normalize_id   # ✅ NEW import
from models.club_model import ClubIn, JoinClubApplication, CreateClubApplication
from controllers import student_controller

# ------------------- Collections -------------------
COLLECTION = "clubs"
COLLECTION_JOIN = "club_join_applications"
COLLECTION_CREATE = "club_create_applications"
COLLECTION_TEACHERS = "teachers"

# ------------------- Helpers -------------------
def serialize_club(club) -> dict:
    return {
        "id": str(club["_id"]),
        "name": club["name"],
        "description": club.get("description", ""),
        "created_by": str(club["created_by"]),
        "members": [str(m) for m in club.get("members", [])],
        "created_at": club["created_at"],
        "approved": club.get("approved", False),
    }

async def check_student_profile(user_id: str):
    completed = await student_controller.is_profile_completed(user_id)
    if not completed:
        raise HTTPException(status_code=400, detail="Complete student profile before applying")

# ------------------- Club Core -------------------
async def list_clubs():
    clubs = await db[COLLECTION].find({"approved": True}).to_list(100)
    result = []
    for c in clubs:
        serialized = serialize_club(c)
        serialized["teachers"] = await list_teachers_by_club(serialized["id"])  # ✅ attach teachers
        result.append(serialized)
    return result

async def get_club(club_id: str):
    club = await db[COLLECTION].find_one({"_id": normalize_id(club_id)})
    if not club:
        raise HTTPException(status_code=404, detail="Club not found")

    serialized = serialize_club(club)
    serialized["teachers"] = await list_teachers_by_club(serialized["id"])
    return serialized

async def create_club(club_in: ClubIn, created_by: str):
    club_data = club_in.dict()
    club_data.update({
        "created_by": normalize_id(created_by),
        "members": [],
        "created_at": datetime.utcnow(),
        "approved": False,
    })
    result = await db[COLLECTION].insert_one(club_data)
    new_club = await db[COLLECTION].find_one({"_id": result.inserted_id})
    return serialize_club(new_club)

async def approve_club(club_id: str):
    oid = normalize_id(club_id)
    club = await db[COLLECTION].find_one({"_id": oid})
    if not club:
        raise HTTPException(status_code=404, detail="Club not found")

    await db[COLLECTION].update_one({"_id": oid}, {"$set": {"approved": True}})
    updated_club = await db[COLLECTION].find_one({"_id": oid})
    return serialize_club(updated_club)

async def join_club(club_id: str, user_id: str):
    oid = normalize_id(club_id)
    club = await db[COLLECTION].find_one({"_id": oid})
    if not club or not club.get("approved", False):
        raise HTTPException(status_code=404, detail="Club not found or not approved")

    user_oid = normalize_id(user_id)
    if user_oid in club.get("members", []):
        raise HTTPException(status_code=400, detail="Already a member")

    await db[COLLECTION].update_one({"_id": oid}, {"$push": {"members": user_oid}})
    updated_club = await db[COLLECTION].find_one({"_id": oid})
    return serialize_club(updated_club)

async def leave_club(club_id: str, user_id: str):
    oid = normalize_id(club_id)
    club = await db[COLLECTION].find_one({"_id": oid})
    if not club or not club.get("approved", False):
        raise HTTPException(status_code=404, detail="Club not found or not approved")

    user_oid = normalize_id(user_id)
    if user_oid not in club.get("members", []):
        raise HTTPException(status_code=400, detail="Not a member")

    await db[COLLECTION].update_one({"_id": oid}, {"$pull": {"members": user_oid}})
    updated_club = await db[COLLECTION].find_one({"_id": oid})
    return serialize_club(updated_club)

# ------------------- Applications -------------------
async def apply_join_club(application: JoinClubApplication, user_id: str):
    await check_student_profile(user_id)
    app_data = application.dict()
    app_data["user_id"] = normalize_id(user_id)
    result = await db[COLLECTION_JOIN].insert_one(app_data)
    app = await db[COLLECTION_JOIN].find_one({"_id": result.inserted_id})
    app["id"] = str(app["_id"])
    return app

async def apply_create_club(application: CreateClubApplication, user_id: str):
    app_data = application.dict()
    app_data["user_id"] = normalize_id(user_id)
    result = await db[COLLECTION_CREATE].insert_one(app_data)
    inserted_app = await db[COLLECTION_CREATE].find_one({"_id": result.inserted_id})
    inserted_app["id"] = str(inserted_app["_id"])
    inserted_app["user_id"] = str(inserted_app["user_id"])
    del inserted_app["_id"]
    return inserted_app

async def list_pending_club_applications():
    apps = []
    async for doc in db[COLLECTION_CREATE].find({}):
        doc["id"] = str(doc["_id"])
        doc["_id"] = str(doc["_id"])
        if "user_id" in doc and isinstance(doc["user_id"], ObjectId):
            doc["user_id"] = str(doc["user_id"])
        apps.append(doc)
    return apps

async def approve_club_application(application_id: str, admin_id: str):
    app = await db[COLLECTION_CREATE].find_one({"_id": normalize_id(application_id)})
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")

    club_doc = {
        "name": f"{app.get('leader_name', 'Unnamed')}'s Club",
        "leader_id": app["user_id"],
        "subleader": {
            "name": app.get("subleader_name", ""),
            "email": app.get("subleader_email", "")
        },
        "created_at": app.get("created_at", datetime.utcnow()),
        "approved": True,
        "members": [app["user_id"]],
        "created_by": admin_id,
    }

    await db[COLLECTION].insert_one(club_doc)
    await db[COLLECTION_CREATE].delete_one({"_id": normalize_id(application_id)})
    return {"message": "✅ Club approved successfully"}

async def reject_club_application(app_id: str):
    oid = normalize_id(app_id)
    result = await db[COLLECTION_CREATE].delete_one({"_id": oid})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Application not found")
    return {"status": "rejected"}

# ------------------- Teachers -------------------
async def add_teacher(teacher: dict):
    if not all(k in teacher for k in ["name", "mobile", "email", "club_id"]):
        raise HTTPException(status_code=400, detail="Missing teacher fields")

    teacher["club_id"] = normalize_id(teacher["club_id"])
    result = await db[COLLECTION_TEACHERS].insert_one(teacher)
    teacher["id"] = str(result.inserted_id)
    teacher["club_id"] = str(teacher["club_id"])
    return teacher

async def list_teachers_by_club(club_id: str):
    teachers = []
    async for doc in db[COLLECTION_TEACHERS].find({"club_id": normalize_id(club_id)}):
        doc["id"] = str(doc["_id"])
        doc["_id"] = str(doc["_id"])
        doc["club_id"] = str(doc["club_id"])
        teachers.append(doc)
    return teachers
