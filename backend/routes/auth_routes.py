# backend/routes/auth_routes.py
from fastapi import APIRouter, HTTPException, status, Depends
from models.user_model import UserRegister, UserLogin
from controllers.auth_controller import register_user, authenticate_user
from utils.jwt_util import create_access_token
from config.db import db
from bson import ObjectId

router = APIRouter(prefix="/api/auth", tags=["auth"])

@router.post("/register")
async def register(data: UserRegister):
    try:
        user_id = await register_user(data)
        return {"message": "User registered successfully", "user_id": user_id}
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
