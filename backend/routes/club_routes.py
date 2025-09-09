# backend/routes/club_routes.py 
from fastapi import APIRouter, Depends
from typing import List
from controllers import club_controller
from models.club_model import ClubIn, ClubOut, JoinClubApplication, CreateClubApplication
from middleware.auth_middleware import require_role

router = APIRouter(prefix="/api/clubs", tags=["clubs"])

# ----------------- Public Routes -----------------
@router.get("/", response_model=List[ClubOut])
async def get_clubs():
    """List all clubs (public)"""
    return await club_controller.list_clubs()

@router.get("/{club_id}", response_model=ClubOut)
async def get_club(club_id: str):
    """Get details of a specific club"""
    return await club_controller.get_club(club_id)

# ----------------- Club Creation -----------------
@router.post("/", response_model=ClubOut)
async def create_club(club_in: ClubIn, user=Depends(require_role(["student", "club", "admin"]))):
    """Create a new club (any logged-in user)"""
    return await club_controller.create_club(club_in, user["_id"])

# ----------------- Admin Approval -----------------
@router.put("/{club_id}/approve", response_model=ClubOut)
async def approve_club(club_id: str, user=Depends(require_role(["admin"]))):
    """Admin approves a club"""
    return await club_controller.approve_club(club_id)

@router.put("/{club_id}/reject", response_model=ClubOut)
async def reject_club(club_id: str, user=Depends(require_role(["admin"]))):
    """Admin rejects a club"""
    return await club_controller.reject_club(club_id)

# ----------------- Student Club Applications -----------------
# NOTE: Literal routes must come BEFORE dynamic routes
@router.post("/apply/join")
async def join_club_application(application: JoinClubApplication, user=Depends(require_role(["student"]))):
    """Student applies to join an existing club (profile check enforced)"""
    return await club_controller.apply_join_club(application, user["_id"])

@router.post("/apply/create")
async def create_club_application(application: CreateClubApplication, user=Depends(require_role(["student"]))):
    """Student applies to create a new club (profile check enforced)"""
    return await club_controller.apply_create_club(application, user["_id"])

# ----------------- Student Join / Leave -----------------
@router.post("/{club_id}/join", response_model=ClubOut)
async def join_club(club_id: str, user=Depends(require_role(["student"]))):
    """Student joins an approved club"""
    return await club_controller.join_club(club_id, user["_id"])

@router.post("/{club_id}/leave", response_model=ClubOut)
async def leave_club(club_id: str, user=Depends(require_role(["student"]))):
    """Student leaves a club"""
    return await club_controller.leave_club(club_id, user["_id"])
