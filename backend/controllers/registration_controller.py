# backend/controllers/registration_controller.py
from bson import ObjectId
from datetime import datetime
from fastapi import HTTPException
from config.db import db
from models.registration_model import RegistrationIn
from utils.qrcode_util import generate_qr_code

COLLECTION = "registrations"

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

async def register_event(event_id: str, user_id: str):
    # check if already registered
    existing = await db[COLLECTION].find_one({"event_id": ObjectId(event_id), "user_id": ObjectId(user_id)})
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
