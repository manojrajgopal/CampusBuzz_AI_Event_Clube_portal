# backend/routes/auth_routes.py
from fastapi import APIRouter, HTTPException, status
from passlib.context import CryptContext
from datetime import datetime

from config.db import db
from bson import ObjectId
from utils.jwt_util import create_access_token
from models.user_model import UserLogin, StudentSignupRequest
from fastapi import Body, Depends
from utils.id_util import normalize_id
from middleware.auth_middleware import require_role, get_current_user

router = APIRouter(prefix="/api/auth", tags=["auth"])
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Student Signup
@router.post("/student/signup")
async def student_signup(data: StudentSignupRequest):
    # Check if email already exists
    existing = await db.users.find_one({"email": data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    # Hash password
    password_hash = pwd_context.hash(data.password)

    # Build document
    user_doc = {
        "name": data.name,
        "email": data.email,
        "password_hash": password_hash,
        "role": "student",
        "created_at": datetime.utcnow()
    }

    # Insert user
    result = await db.users.insert_one(user_doc)

    return {
        "message": "Student registered successfully",
        "user": {
            "user_id": str(result.inserted_id),
            "name": user_doc["name"],
            "email": user_doc["email"],
            "role": user_doc["role"],
            "created_at": user_doc["created_at"].isoformat()
        }
    }

# Student Login
@router.post("/student/login")
async def student_login(data: UserLogin):
    # Find student user
    user = await db.users.find_one({"email": data.email, "role": "student"})
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    # Password authentication
    if not pwd_context.verify(data.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    # Create JWT token
    token = create_access_token({
        "user_id": str(user["_id"]),
        "role": user["role"],
        "email": user["email"]
    })

    # Check if first time login (for profile setup)
    first_time = not await db.student_profiles.find_one({"user_id": user["_id"]})

    return {
        "access_token": token,
        "token_type": "bearer",
        "role": "student",
        "first_time": first_time,
        "user_id": str(user["_id"]),
        "name": user["name"]
    }

# Club Login (UNCHANGED)
@router.post("/club/login")
async def club_login(data: UserLogin):
    # Find club by email
    club = await db.clubs.find_one({"email": data.email})
    if not club:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    # Compare plain text password
    if club.get("password") != data.password:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    # Create JWT token with club_id
    token = create_access_token({"club_id": str(club["_id"])})

    return {
        "club_id": str(club["_id"]),
        "access_token": token,
    }

# Admin Login (UNCHANGED)
@router.post("/admin/login")
async def admin_login(data: UserLogin):
    # Authenticate admin user
    user = await db.users.find_one({"email": data.email, "role": "admin"})
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    if not pwd_context.verify(data.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    # Create token
    token = create_access_token({"user_id": str(user["_id"]), "role": user["role"]})
    
    return {"access_token": token, "role": "admin"}