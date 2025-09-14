from fastapi import APIRouter, HTTPException, status
from passlib.context import CryptContext
from datetime import datetime
from config.db import db
from utils.id_util import normalize_id
from utils.jwt_util import create_access_token
from models.user_model import UserRegister, UserLogin
from bson import ObjectId

router = APIRouter(prefix="/api/auth", tags=["auth"])

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
USERS_COLLECTION = "users"

# ------------------ HELPERS ------------------
def serialize_user(user):
    return {
        "user_id": str(user["_id"]),
        "name": user["name"],
        "email": user["email"],
        "role": user["role"],
        "created_at": user.get("created_at").isoformat() if "created_at" in user else None
    }

async def register_user(data):
    existing = await db[USERS_COLLECTION].find_one({"email": data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    password_hash = pwd_context.hash(data.password)
    user_doc = {
        "name": data.name,
        "email": data.email,
        "password_hash": password_hash,
        "role": "student",  # 👈 only students can sign up
        "created_at": datetime.utcnow()
    }

    result = await db[USERS_COLLECTION].insert_one(user_doc)
    user_doc["_id"] = normalize_id(result.inserted_id)
    return serialize_user(user_doc)

async def authenticate_user(email: str, password: str, role: str):
    user = await db[USERS_COLLECTION].find_one({"email": email, "role": role})
    if not user:
        return None
    if not pwd_context.verify(password, user["password_hash"]):
        return None
    print("Authenticated user:", user)  # Debugging line
    return user

def make_token(user):
    user_id = str(user["_id"])
    role = user["role"]
    token = create_access_token({"user_id": user_id, "role": role})
    return token

# ------------------ ROUTES ------------------

# Student Signup
@router.post("/student/signup")
async def student_signup(data: UserRegister):
    user = await register_user(data)
    return {"message": "Student registered successfully", "user": user}

# Student Login
@router.post("/student/login")
async def student_login(data: UserLogin):
    user = await authenticate_user(data.email, data.password, "student")
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = make_token(user)
    first_time = not await db["student_profiles"].find_one({"user_id": user["_id"]})

    return {
        "access_token": token,
        "role": "student",
        "first_time": first_time
    }

# Club Login
# Club Login
@router.post("/club/login")
async def club_login(data: UserLogin):
    # Find club by email only (no role check)
    club = await db["clubs"].find_one({"email": data.email})
    if not club:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    # Compare plain text password (no hashing here)
    if club.get("password") != data.password:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    # Create JWT token with club_id
    token = create_access_token({"club_id": str(club["_id"])})

    return {
        "club_id": str(club["_id"]),
        "access_token": token,
    }

# Admin Login
@router.post("/admin/login")
async def admin_login(data: UserLogin):
    user = await authenticate_user(data.email, data.password, "admin")
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = make_token(user)
    return {"access_token": token, "role": "admin"}
