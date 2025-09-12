# reegistration_routers
from fastapi import APIRouter, Depends, HTTPException
from typing import List
from bson import ObjectId
from datetime import datetime
from models.registration_model import RegistrationOut
from middleware.auth_middleware import require_role, get_current_user
from config.db import db
from utils.qrcode_util import generate_qr_code
from .student_routes import is_profile_completed


router = APIRouter(prefix="/api/registrations", tags=["registrations"])

COLLECTION = "registrations"

# ----------------- Helpers -----------------
def serialize_registration(reg):
    return {
        "id": str(reg["_id"]),
        "event_id": str(reg["event_id"]),
        "user_id": str(reg["user_id"]),
        "qr_code_data": reg["qr_code_data"],
        "checked_in": reg["checked_in"],
        "registered_at": reg["registered_at"],
        "checked_in_at": reg.get("checked_in_at")
    }

# ----------------- Core Functions -----------------
async def register_event(event_id: str, user_id: str):
    existing = await db[COLLECTION].find_one({
        "event_id": ObjectId(event_id),
        "user_id": ObjectId(user_id)
    })
    if existing:
        raise HTTPException(status_code=400, detail="Already registered")

    qr_data = f"{event_id}:{user_id}:{datetime.utcnow().timestamp()}"
    qr_code_b64 = generate_qr_code(qr_data)

    registration = {
        "event_id": ObjectId(event_id),
        "user_id": ObjectId(user_id),
        "qr_code_data": qr_code_b64,
        "checked_in": False,
        "registered_at": datetime.utcnow(),
    }
    result = await db[COLLECTION].insert_one(registration)
    new_reg = await db[COLLECTION].find_one({"_id": result.inserted_id})
    return serialize_registration(new_reg)


async def check_in_registration(registration_id: str):
    reg = await db[COLLECTION].find_one({"_id": ObjectId(registration_id)})
    if not reg:
        raise HTTPException(status_code=404, detail="Registration not found")
    if reg.get("checked_in"):
        raise HTTPException(status_code=400, detail="Already checked in")

    await db[COLLECTION].update_one(
        {"_id": ObjectId(registration_id)},
        {"$set": {"checked_in": True, "checked_in_at": datetime.utcnow()}}
    )
    updated_reg = await db[COLLECTION].find_one({"_id": ObjectId(registration_id)})
    return serialize_registration(updated_reg)


async def list_registrations(user_id: str):
    regs = await db[COLLECTION].find({"user_id": ObjectId(user_id)}).to_list(100)
    return [serialize_registration(r) for r in regs]

# ----------------- Routes -----------------
@router.post("/register", response_model=RegistrationOut)
async def register_for_event(event_id: str, current_user: dict = Depends(get_current_user)):
    # Check if student profile is completed
    completed = await is_profile_completed(current_user["_id"])
    if not completed:
        raise HTTPException(status_code=400, detail="Complete your student profile before registering for events")
    try:
        return await register_event(event_id, current_user["_id"])
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{registration_id}/checkin", response_model=RegistrationOut)
async def check_in(registration_id: str, user=Depends(require_role(["student", "club", "admin"]))):
    return await check_in_registration(registration_id)


@router.get("/", response_model=List[RegistrationOut])
async def my_registrations(user=Depends(require_role(["student"]))):
    return await list_registrations(user["_id"])
