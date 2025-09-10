# backend/routes/auth_routes.py
from fastapi import APIRouter, HTTPException, status, Depends
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
        "user_id": str(user["_id"]),  # always string for frontend
        "name": user["name"],
        "email": user["email"],
        "role": user["role"],
        "created_at": user.get("created_at").isoformat() if "created_at" in user else None
    }

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
        user_doc["_id"] = normalize_id(result.inserted_id)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating user: {str(e)}"
        )

    return serialize_user(user_doc)

async def authenticate_user(email: str, password: str):
    user = await db[USERS_COLLECTION].find_one({"email": email})
    if not user:
        return None
    if not pwd_context.verify(password, user["password_hash"]):
        return None
    return user

# ------------------ ROUTES ------------------
@router.post("/register")
async def register(data: UserRegister):
    try:
        user_data = await register_user(data)
        return {"message": "User registered successfully", "user_id": user_data}
    except HTTPException as e:
        raise e
    except Exception as e:
        print("❌ Error in register:", e)
        raise HTTPException(status_code=500, detail="Internal Server Error")


@router.post("/login")
async def login(data: UserLogin):
    try:
        user = await authenticate_user(data.email, data.password)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password"
            )

        user_id = str(user.get("_id") or user.get("id"))
        role = user.get("role")

        access_token = create_access_token({
            "user_id": user_id,
            "role": role
        })

        # --- First-time student profile check ---
        first_time = False
        if role == "student":
            profile = await db["student_profiles"].find_one({"user_id": ObjectId(user_id)})
            if not profile:
                first_time = True

        return {
            "access_token": access_token,
            "token_type": "bearer",
            "role": role,
            "first_time": first_time
        }

    except HTTPException as e:
        raise e
    except Exception as e:
        import traceback; traceback.print_exc()
        raise HTTPException(status_code=500, detail="Internal Server Error")
