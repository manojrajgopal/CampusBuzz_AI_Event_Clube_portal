# backend/controllers/auth_controller.py
from fastapi import HTTPException, status
from passlib.context import CryptContext
from datetime import datetime
from config.db import db
from bson import ObjectId

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
USERS_COLLECTION = "users"

async def register_user(data):
    # Check if email already exists
    existing = await db[USERS_COLLECTION].find_one({"email": data.email})
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Hash password
    password_hash = pwd_context.hash(data.password)

    user_doc = {
    "name": data.name,
    "email": data.email,
    "password_hash": password_hash,
    "role": data.role,
    "skills": [],
    "interests": [],
    "created_at": datetime.utcnow()
}

    result = await db[USERS_COLLECTION].insert_one(user_doc)
    user_doc["_id"] = result.inserted_id
    return serialize_user(user_doc)

async def authenticate_user(email: str, password: str):
    user = await db[USERS_COLLECTION].find_one({"email": email})
    if not user or not pwd_context.verify(password, user["password_hash"]):
        return None
    return user


def serialize_user(user):
    return {
        "id": str(user["_id"]),
        "name": user["name"],
        "email": user["email"],
        "role": user["role"],
        "created_at": user["created_at"].isoformat() if "created_at" in user else None
    }

