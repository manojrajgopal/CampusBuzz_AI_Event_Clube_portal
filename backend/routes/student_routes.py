# student_routes.py
from fastapi import APIRouter, Depends, HTTPException
from bson import ObjectId
from config.db import db
from models.student_model import StudentProfileIn, StudentProfileOut
from middleware.auth_middleware import require_role

router = APIRouter(prefix="/api/student", tags=["student"])

COLLECTION = "student_profiles"

# ----------------- Helpers -----------------
def serialize_profile(profile):
    return {
        "user_id": str(profile["user_id"]),
        **{k: profile[k] for k in profile if k != "_id" and k != "user_id"}
    }

# ----------------- Core Functions -----------------
async def create_or_update_profile(user_id: str, profile_in: StudentProfileIn):
    existing = await db[COLLECTION].find_one({"user_id": ObjectId(user_id)})
    profile_data = profile_in.dict()
    profile_data["user_id"] = ObjectId(user_id)

    if existing:
        await db[COLLECTION].update_one({"user_id": ObjectId(user_id)}, {"$set": profile_data})
        updated = await db[COLLECTION].find_one({"user_id": ObjectId(user_id)})
        return serialize_profile(updated)
    else:
        result = await db[COLLECTION].insert_one(profile_data)
        new_profile = await db[COLLECTION].find_one({"_id": result.inserted_id})
        return serialize_profile(new_profile)

async def get_profile(user_id: str):
    profile = await db[COLLECTION].find_one({"user_id": ObjectId(user_id)})
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    return serialize_profile(profile)


async def is_profile_completed(user_id: str) -> bool:
    profile = await db[COLLECTION].find_one({"user_id": ObjectId(user_id)})
    return profile is not None


# ----------------- Routes -----------------
@router.post("/profile", response_model=StudentProfileOut)
async def create_profile(profile: StudentProfileIn, user=Depends(require_role(["student"]))):
    return await create_or_update_profile(user["_id"], profile)


@router.get("/profile", response_model=StudentProfileOut)
async def get_profile_route(user=Depends(require_role(["student"]))):
    return await get_profile(user["_id"])


@router.get("/profile/completed")
async def check_profile(user=Depends(require_role(["student"]))):
    completed = await is_profile_completed(user["_id"])
    return {"profile_completed": completed}

def convert_objectid(doc: dict):
    """Convert ObjectId fields to strings for JSON serialization"""
    for key, value in doc.items():
        if isinstance(value, ObjectId):
            doc[key] = str(value)
        elif isinstance(value, list):
            # recursively convert if list contains ObjectIds
            doc[key] = [str(v) if isinstance(v, ObjectId) else v for v in value]
        elif isinstance(value, dict):
            doc[key] = convert_objectid(value)
    return doc

@router.get("/students")
async def list_of_students():
    students = {}
    cursor = db["student_profiles"].find({})
    async for doc in cursor:
        usn = doc.get("USN_id")
        if usn:
            doc.pop("_id", None)  # remove MongoDB _id if not needed
            doc = convert_objectid(doc)
            students[usn] = doc
    return students