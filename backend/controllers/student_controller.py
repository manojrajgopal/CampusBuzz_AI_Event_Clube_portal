# backend/controllers/student_controller.py
from config.db import db
from bson import ObjectId
from fastapi import HTTPException
from models.student_model import StudentProfileIn, StudentProfileOut

COLLECTION = "student_profiles"

def serialize_profile(profile):
    return {
        "user_id": str(profile["user_id"]),
        **{k: profile[k] for k in profile if k != "_id" and k != "user_id"}
    }

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