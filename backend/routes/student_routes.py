# backend/routes/student_routes.py
from fastapi import APIRouter, Depends
from controllers import student_controller
from models.student_model import StudentProfileIn, StudentProfileOut
from middleware.auth_middleware import require_role


router = APIRouter(prefix="/api/student", tags=["student"])

# Existing endpoints
@router.post("/profile", response_model=StudentProfileOut)
async def create_profile(profile: StudentProfileIn, user=Depends(require_role(["student"]))):
    return await student_controller.create_or_update_profile(user["_id"], profile)

@router.get("/profile", response_model=StudentProfileOut)
async def get_profile(user=Depends(require_role(["student"]))):
    return await student_controller.get_profile(user["_id"])

# ✅ New endpoint: check if profile exists
@router.get("/profile/completed")
async def check_profile(user=Depends(require_role(["student"]))):
    completed = await student_controller.is_profile_completed(user["_id"])
    return {"profile_completed": completed}
