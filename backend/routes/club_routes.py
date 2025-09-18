# backend/routes/club_routes.py
from fastapi import APIRouter, Depends, HTTPException
from typing import List
from bson import ObjectId
from datetime import datetime
from passlib.context import CryptContext

from models.club_model import (
    ClubIn,
    ClubOut,
    JoinClubApplication,
    CreateClubApplication,
    TeacherIn,
    TeacherOut,
)
from middleware.auth_middleware import require_role
from config.db import db
from utils.mongo_utils import sanitize_doc
from utils.id_util import normalize_id



router = APIRouter(prefix="/api/clubs", tags=["clubs"])

# ----------------- Collections & Password -----------------
COLLECTION = "clubs"
COLLECTION_JOIN = "club_join_applications"
COLLECTION_CREATE = "club_create_applications"
COLLECTION_TEACHERS = "teachers"
USERS_COLLECTION = "users"

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# ----------------- Helpers -----------------
def validate_object_id(id_str: str) -> ObjectId:
    """Ensure the given string is a valid MongoDB ObjectId."""
    if not ObjectId.is_valid(id_str):
        raise HTTPException(status_code=400, detail=f"Invalid ObjectId: {id_str}")
    return ObjectId(id_str)


def serialize_club(club) -> dict:
    return {
        "id": str(club["_id"]),
        "name": club["name"],
        "description": club.get("description", ""),
        "created_by": str(club["created_by"]),
        "members": [str(m) for m in club.get("members", [])],
        "created_at": club["created_at"].isoformat(),
        "approved": club.get("approved", False),
        "email": club.get("email", ""),
        "leader_id": str(club.get("leader_id", "")),
        "subleader": club.get("subleader", {}),
    }

async def check_student_profile(user_id: str):
    completed = await student_controller.is_profile_completed(user_id)
    if not completed:
        raise HTTPException(status_code=400, detail="Complete student profile before applying")


# ----------------- Core Club Functions -----------------
async def list_clubs():
    clubs = await db[COLLECTION].find({"approved": True}).to_list(100)
    result = []
    for c in clubs:
        serialized = serialize_club(c)
        serialized["teachers"] = await list_teachers_by_club(serialized["id"])
        result.append(serialized)
    return result

@router.get("/{club_id}", response_model=ClubOut)
async def get_club(club_id: str):
    try:

        club = await db.clubs.find_one({"_id": ObjectId(club_id)})

        if not club:

            raise HTTPException(status_code=404, detail="Club not found")
        
        club = sanitize_doc(club)
        try:
            club["teachers"] = await db.teachers.find({"club_id": ObjectId(club_id)}, {"_id": 0, "name": 1, "email": 1, "mobile": 1}).to_list(None)
            
        except Exception as e:
      
            club["teachers"] = []

        # Map Mongo fields to Pydantic fields
        club["id"] = club.pop("_id")   # ✅ Pydantic expects `id`
        club["description"] = club.get("description", "No description provided")  # ✅ Ensure description
        club["members"] = [str(m) for m in club.get("members", [])]  # ✅ Convert ObjectIds to strings
        club["created_by"] = str(club.get("created_by", "unknown"))
        club["leader"] = await db.users.find_one({"_id": ObjectId(club.get("leader_id"))}, {"_id": 0, "name": 1, "email": 1, "mobile": 1}) if club.get("leader_id") else None
        club["created_at"] = club.get("created_at") or datetime.utcnow()
        print(club)
        return ClubOut(**club)

    except Exception as e:
        print("Error in get_club:", str(e))
        raise HTTPException(status_code=400, detail="Invalid club ID")

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


async def reject_club(club_id: str):
    oid = normalize_id(club_id)
    club = await db[COLLECTION].find_one({"_id": oid})
    if not club:
        raise HTTPException(status_code=404, detail="Club not found")
    await db[COLLECTION].update_one({"_id": oid}, {"$set": {"approved": False}})
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


# ----------------- Applications -----------------
async def apply_join_club(application: JoinClubApplication, user_id: str):
    # check student profile
    completed = await is_profile_completed(user_id)
    if not completed:
        raise HTTPException(status_code=400, detail="Complete your student profile before applying")
    
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

# ----------------- Join Requests Management -----------------

async def list_join_requests(club_id: str):
    requests = []
    async for doc in db[COLLECTION_JOIN].find({"club_id": normalize_id(club_id)}):
        doc["id"] = str(doc["_id"])
        doc["_id"] = str(doc["_id"])
        doc["user_id"] = str(doc["user_id"])

        # 🔹 Fetch student details
        user = await db[USERS_COLLECTION].find_one(
            {"_id": normalize_id(doc["user_id"])},
            {"_id": 0, "name": 1, "email": 1}
        )
        if user:
            doc["name"] = user.get("name", "Unknown")
            doc["email"] = user.get("email", "N/A")
        else:
            doc["name"] = "Unknown"
            doc["email"] = "N/A"

        requests.append(doc)
    return requests



async def approve_join_request(club_id: str, request_id: str):
    req = await db[COLLECTION_JOIN].find_one({"_id": normalize_id(request_id)})
    if not req:
        raise HTTPException(status_code=404, detail="Join request not found")

    # Add student to club members
    await db[COLLECTION].update_one(
        {"_id": normalize_id(club_id)},
        {"$addToSet": {"members": normalize_id(req["user_id"])}}
    )

    # Remove request after approval
    await db[COLLECTION_JOIN].delete_one({"_id": normalize_id(request_id)})
    return {"status": "approved", "user_id": str(req["user_id"])}


async def reject_join_request(request_id: str):
    req = await db[COLLECTION_JOIN].find_one({"_id": normalize_id(request_id)})
    if not req:
        raise HTTPException(status_code=404, detail="Join request not found")

    await db[COLLECTION_JOIN].delete_one({"_id": normalize_id(request_id)})
    return {"status": "rejected", "user_id": str(req["user_id"])}




async def approve_club_application(application_id: str, admin_id: str):
    app = await db[COLLECTION_CREATE].find_one({"_id": normalize_id(application_id)})
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")

    # --- Create club user in USERS_COLLECTION for login ---
    existing = await db[USERS_COLLECTION].find_one({"email": app["club_email"]})
    if existing:
        raise HTTPException(status_code=400, detail="Club email already in use")

    password_hash = pwd_context.hash(app["club_password"])

    club_user_doc = {
        "name": app["club_name"],
        "email": app["club_email"],
        "password_hash": password_hash,
        "role": "club",
        "created_at": datetime.utcnow(),
    }
    result_user = await db[USERS_COLLECTION].insert_one(club_user_doc)
    club_user_id = result_user.inserted_id

    # --- Create the club in clubs collection ---
    club_doc = {
        "name": app.get("club_name"),
        "email": app.get("club_email"),
        "password": app.get("club_password"),
        "leader_id": normalize_id(app["user_id"]),
        "subleader": {
            "name": app.get("subleader_name", ""),
            "email": app.get("subleader_email", "")
        },
        "created_at": datetime.utcnow(),
        "approved": True,
        "members": [normalize_id(app["user_id"])],
        "created_by": normalize_id(admin_id),
    }

    # Insert into clubs collection
    await db[COLLECTION].insert_one(club_doc)

    # Remove the original application
    await db[COLLECTION_CREATE].delete_one({"_id": normalize_id(application_id)})

    return {"message": "✅ Club approved successfully", "club_user_id": str(club_user_id)}


async def reject_club_application(app_id: str):
    oid = normalize_id(app_id)
    result = await db[COLLECTION_CREATE].delete_one({"_id": oid})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Application not found")
    return {"status": "rejected"}


# ----------------- Teachers -----------------
# ----------------- Teachers -----------------
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

# ----------------- Routes -----------------

# Public Routes
@router.get("/{club_id}", response_model=ClubOut)
async def get_club_route(club_id: str):
    return await get_club(str(validate_object_id(club_id)))

# Student Applications
@router.post("/apply/join")
async def join_club_application(application: JoinClubApplication, user=Depends(require_role(["student"]))):
    return await apply_join_club(application, user["_id"])


# Student applies to create a new club
@router.post("/apply/create")
async def create_club_application(
    application: CreateClubApplication,
    user=Depends(require_role(["student"]))
):
    await check_student_profile(user["_id"])
    return await apply_create_club(application, user["_id"])

# Admin Application Endpoints
@router.get("/applications", dependencies=[Depends(require_role(["admin"]))])
async def get_pending_applications():
    return await list_pending_club_applications()


@router.post("/applications/{app_id}/approve", dependencies=[Depends(require_role(["admin"]))])
async def approve_application(app_id: str, user=Depends(require_role(["admin"]))):
    return await approve_club_application(app_id, user["_id"])


@router.delete("/applications/{app_id}/reject", dependencies=[Depends(require_role(["admin"]))])
async def reject_application(app_id: str):
    return await reject_club_application(app_id)


# Club Creation
@router.post("/", response_model=ClubOut)
async def create_club_route(club_in: ClubIn, user=Depends(require_role(["student", "club", "admin"]))):
    return await create_club(club_in, user["_id"])


# Admin Approval for Clubs
@router.put("/{club_id}/approve", response_model=ClubOut)
async def approve_club_route(club_id: str, user=Depends(require_role(["admin"]))):
    return await approve_club(str(validate_object_id(club_id)))


@router.put("/{club_id}/reject", response_model=ClubOut)
async def reject_club_route(club_id: str, user=Depends(require_role(["admin"]))):
    return await reject_club(str(validate_object_id(club_id)))


# Student Join / Leave
@router.post("/{club_id}/join", response_model=ClubOut)
async def join_club_route(club_id: str, user=Depends(require_role(["student"]))):
    return await join_club(str(validate_object_id(club_id)), user["_id"])


@router.post("/{club_id}/leave", response_model=ClubOut)
async def leave_club_route(club_id: str, user=Depends(require_role(["student"]))):
    return await leave_club(str(validate_object_id(club_id)), user["_id"])

# Teachers



@router.get("/{club_id}/teachers", response_model=List[TeacherOut])
async def get_club_teachers_route(club_id: str):
    return await list_teachers_by_club(str(validate_object_id(club_id)))

# Club Leader/Admin – Manage Join Requests
@router.get("/{club_id}/join-requests", dependencies=[Depends(require_role(["club", "admin"]))])
async def get_join_requests(club_id: str):
    return await list_join_requests(club_id)


@router.post("/{club_id}/join-requests/{request_id}/approve", dependencies=[Depends(require_role(["club", "admin"]))])
async def approve_request_route(club_id: str, request_id: str):
    return await approve_join_request(club_id, request_id)


@router.delete("/{club_id}/join-requests/{request_id}/reject", dependencies=[Depends(require_role(["club", "admin"]))])
async def reject_request_route(club_id: str, request_id: str):
    return await reject_join_request(request_id)

