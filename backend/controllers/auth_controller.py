# backend/controllers/auth_controller.py
from fastapi import HTTPException, status
from passlib.context import CryptContext
from datetime import datetime
from config.db import db
from utils.id_util import normalize_id  # ✅ NEW import

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
USERS_COLLECTION = "users"

# ------------------ REGISTER ------------------
async def register_user(data):
    if data.role not in ["student", "admin", "club"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid role"
        )

    existing = await db[USERS_COLLECTION].find_one({"email": data.email})
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
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

    try:
        result = await db[USERS_COLLECTION].insert_one(user_doc)
        user_doc["_id"] = normalize_id(result.inserted_id)  # ✅ normalize
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating user: {str(e)}"
        )

    return serialize_user(user_doc)

# ------------------ LOGIN ------------------
async def authenticate_user(email: str, password: str):
    user = await db[USERS_COLLECTION].find_one({"email": email})
    if not user:
        return None
    if not pwd_context.verify(password, user["password_hash"]):
        return None
    return user

# ------------------ SERIALIZE ------------------
def serialize_user(user):
    return {
        "user_id": str(user["_id"]),  # always string for frontend
        "name": user["name"],
        "email": user["email"],
        "role": user["role"],
        "created_at": user.get("created_at").isoformat() if "created_at" in user else None
    }
