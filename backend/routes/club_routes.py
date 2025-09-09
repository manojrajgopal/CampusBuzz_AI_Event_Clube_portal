# backend/routes/club_routes.py
from fastapi import APIRouter, Depends
from typing import List
from controllers import club_controller
from models.club_model import ClubIn, ClubOut
from middleware.auth_middleware import require_role

router = APIRouter(prefix="/api/clubs", tags=["clubs"])

# Public
@router.get("/", response_model=List[ClubOut])
async def get_clubs():
    return await club_controller.list_clubs()

@router.get("/{club_id}", response_model=ClubOut)
async def get_club(club_id: str):
    return await club_controller.get_club(club_id)

# Club creation (any logged-in user)
@router.post("/", response_model=ClubOut)
async def create_club(club_in: ClubIn, user=Depends(require_role(["student", "club", "admin"]))):
    return await club_controller.create_club(club_in, user["_id"])

# Admin approves
@router.put("/{club_id}/approve", response_model=ClubOut)
async def approve_club(club_id: str, user=Depends(require_role(["admin"]))):
    return await club_controller.approve_club(club_id)

# Join/Leave (students)
@router.post("/{club_id}/join", response_model=ClubOut)
async def join_club(club_id: str, user=Depends(require_role(["student"]))):
    return await club_controller.join_club(club_id, user["_id"])

@router.post("/{club_id}/leave", response_model=ClubOut)
async def leave_club(club_id: str, user=Depends(require_role(["student"]))):
    return await club_controller.leave_club(club_id, user["_id"])
