from fastapi import APIRouter, Depends, HTTPException
from typing import List
from bson import ObjectId
from controllers import club_controller
from models.club_model import (
    ClubIn,
    ClubOut,
    JoinClubApplication,
    CreateClubApplication,
    TeacherIn,
    TeacherOut,
)
from middleware.auth_middleware import require_role

router = APIRouter(prefix="/api/clubs", tags=["clubs"])


# ----------------- Helpers -----------------
def validate_object_id(id_str: str) -> ObjectId:
    """Ensure the given string is a valid MongoDB ObjectId."""
    if not ObjectId.is_valid(id_str):
        raise HTTPException(status_code=400, detail=f"Invalid ObjectId: {id_str}")
    return ObjectId(id_str)


# ----------------- Public Routes -----------------
@router.get("/", response_model=List[ClubOut])
async def get_clubs():
    """List all clubs (public)"""
    return await club_controller.list_clubs()


# ----------------- Student Club Applications -----------------
@router.post("/apply/join")
async def join_club_application(
    application: JoinClubApplication, user=Depends(require_role(["student"]))
):
    return await club_controller.apply_join_club(application, user["_id"])


@router.post("/apply/create")
async def create_club_application(
    application: CreateClubApplication,
    user=Depends(require_role(["student"]))
):
    return await club_controller.apply_create_club(application, user["_id"])


# ----------------- Admin endpoints (Applications) -----------------
@router.get("/applications", dependencies=[Depends(require_role(["admin"]))])
async def get_pending_applications():
    return await club_controller.list_pending_club_applications()


@router.post("/applications/{app_id}/approve", dependencies=[Depends(require_role(["admin"]))])
async def approve_application(app_id: str, user=Depends(require_role(["admin"]))):
    """Admin approves a club application"""
    # Pass app_id as-is; controller handles string vs ObjectId internally
    return await club_controller.approve_club_application(app_id, user["_id"])


@router.delete("/applications/{app_id}/reject", dependencies=[Depends(require_role(["admin"]))])
async def reject_application(app_id: str):
    """Admin rejects a club application"""
    return await club_controller.reject_club_application(app_id)


# ----------------- Club Creation -----------------
@router.post("/", response_model=ClubOut)
async def create_club(club_in: ClubIn, user=Depends(require_role(["student", "club", "admin"]))):
    return await club_controller.create_club(club_in, user["_id"])


# ----------------- Admin Approval for Clubs -----------------
@router.put("/{club_id}/approve", response_model=ClubOut)
async def approve_club(club_id: str, user=Depends(require_role(["admin"]))):
    return await club_controller.approve_club(str(validate_object_id(club_id)))


@router.put("/{club_id}/reject", response_model=ClubOut)
async def reject_club(club_id: str, user=Depends(require_role(["admin"]))):
    return await club_controller.reject_club(str(validate_object_id(club_id)))


# ----------------- Student Join / Leave -----------------
@router.post("/{club_id}/join", response_model=ClubOut)
async def join_club(club_id: str, user=Depends(require_role(["student"]))):
    return await club_controller.join_club(str(validate_object_id(club_id)), user["_id"])


@router.post("/{club_id}/leave", response_model=ClubOut)
async def leave_club(club_id: str, user=Depends(require_role(["student"]))):
    return await club_controller.leave_club(str(validate_object_id(club_id)), user["_id"])


# ----------------- Teachers -----------------
@router.post("/teachers", response_model=TeacherOut, dependencies=[Depends(require_role(["admin"]))])
async def add_teacher(teacher: TeacherIn):
    return await club_controller.add_teacher(teacher.dict())


@router.get("/{club_id}/teachers", response_model=List[TeacherOut])
async def get_club_teachers(club_id: str):
    return await club_controller.list_teachers_by_club(str(validate_object_id(club_id)))


# ----------------- Club Details (must come last) -----------------
@router.get("/{club_id}", response_model=ClubOut)
async def get_club(club_id: str):
    return await club_controller.get_club(str(validate_object_id(club_id)))
