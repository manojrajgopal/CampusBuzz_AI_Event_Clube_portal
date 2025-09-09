# backend/controllers/club_controller.py
from bson import ObjectId
from datetime import datetime
from fastapi import HTTPException
from config.db import db
from models.club_model import ClubIn, ClubOut

COLLECTION = "clubs"

def serialize_club(club) -> dict:
    return {
        "id": str(club["_id"]),
        "name": club["name"],
        "description": club["description"],
        "created_by": str(club["created_by"]),
        "members": [str(m) for m in club.get("members", [])],
        "created_at": club["created_at"],
        "approved": club.get("approved", False),
    }

async def list_clubs():
    clubs = await db[COLLECTION].find({"approved": True}).to_list(100)
    return [serialize_club(c) for c in clubs]

async def get_club(club_id: str):
    club = await db[COLLECTION].find_one({"_id": ObjectId(club_id)})
    if not club:
        raise HTTPException(status_code=404, detail="Club not found")
    return serialize_club(club)

async def create_club(club_in: ClubIn, created_by: str):
    club_data = club_in.dict()
    club_data.update({
        "created_by": ObjectId(created_by),
        "members": [],
        "created_at": datetime.utcnow(),
        "approved": False,  # Admin must approve
    })
    result = await db[COLLECTION].insert_one(club_data)
    new_club = await db[COLLECTION].find_one({"_id": result.inserted_id})
    return serialize_club(new_club)

async def approve_club(club_id: str):
    club = await db[COLLECTION].find_one({"_id": ObjectId(club_id)})
    if not club:
        raise HTTPException(status_code=404, detail="Club not found")
    await db[COLLECTION].update_one({"_id": ObjectId(club_id)}, {"$set": {"approved": True}})
    updated_club = await db[COLLECTION].find_one({"_id": ObjectId(club_id)})
    return serialize_club(updated_club)

async def join_club(club_id: str, user_id: str):
    club = await db[COLLECTION].find_one({"_id": ObjectId(club_id)})
    if not club or not club.get("approved", False):
        raise HTTPException(status_code=404, detail="Club not found or not approved")
    if ObjectId(user_id) in club.get("members", []):
        raise HTTPException(status_code=400, detail="Already a member")
    await db[COLLECTION].update_one(
        {"_id": ObjectId(club_id)},
        {"$push": {"members": ObjectId(user_id)}}
    )
    updated_club = await db[COLLECTION].find_one({"_id": ObjectId(club_id)})
    return serialize_club(updated_club)

async def leave_club(club_id: str, user_id: str):
    club = await db[COLLECTION].find_one({"_id": ObjectId(club_id)})
    if not club or not club.get("approved", False):
        raise HTTPException(status_code=404, detail="Club not found or not approved")
    if ObjectId(user_id) not in club.get("members", []):
        raise HTTPException(status_code=400, detail="Not a member")
    await db[COLLECTION].update_one(
        {"_id": ObjectId(club_id)},
        {"$pull": {"members": ObjectId(user_id)}}
    )
    updated_club = await db[COLLECTION].find_one({"_id": ObjectId(club_id)})
    return serialize_club(updated_club)
