# backend/routes/auth_routes.py
from fastapi import APIRouter, HTTPException, status
from models.user_model import UserRegister, UserLogin
from controllers.auth_controller import register_user, authenticate_user
from utils.jwt_util import create_access_token
import traceback

router = APIRouter(prefix="/api/auth", tags=["auth"])

@router.post("/register")
async def register(data: UserRegister):
    try:
        user_id = await register_user(data)
        return {"message": "User registered successfully", "user_id": user_id}
    except HTTPException as e:
        raise e
    except Exception as e:
        print("❌ Error in register:", e)  # show in console
        raise HTTPException(status_code=500, detail="Internal Server Error")

@router.post("/login")
async def login(data: UserLogin):
    try:
        user = await authenticate_user(data.email, data.password)
        print("🔎 Authenticated user:", user)   # <--- DEBUG

        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password"
            )

        # handle both raw Mongo doc and serialized user
        user_id = str(user.get("_id") or user.get("id"))
        role = user.get("role")

        print("✅ user_id:", user_id, "role:", role)  # <--- DEBUG

        access_token = create_access_token({
            "user_id": user_id,
            "role": role
        })
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "role": role
        }
    except HTTPException as e:
        raise e
    except Exception as e:
        import traceback; traceback.print_exc()
        raise HTTPException(status_code=500, detail="Internal Server Error")
