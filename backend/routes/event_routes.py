# backend/routes/event_routes.py
from fastapi import APIRouter, Depends, HTTPException
from typing import List
from bson import ObjectId
from bson.errors import InvalidId
from datetime import datetime
import qrcode, io, base64

from config.db import db
from models.event_model import EventIn, EventOut, RegistrationOut, TeacherIn, TeacherOut
from middleware.auth_middleware import require_role

router = APIRouter(prefix="/api/events", tags=["events"])

COLLECTION_EVENTS = "events"
COLLECTION_REGISTRATIONS = "event_registrations"
COLLECTION_TEACHERS = "teachers"

# ----------------- Helpers -----------------
def serialize_event(event) -> dict:
    return {
        "id": str(event["_id"]),
        "title": event["title"],
        "description": event["description"],
        "venue": event["venue"],
        "date": event["date"],
        "tags": event.get("tags", []),
        "poster": event.get("poster"),
        "isPaid": event.get("isPaid", False),
        "clubId": str(event.get("clubId")) if event.get("clubId") else None,
        "created_by": str(event["created_by"]),
        "created_at": event["created_at"],
        "updated_at": event.get("updated_at"),
    }

def serialize_registration(reg) -> dict:
    return {
        "id": str(reg["_id"]),
        "event_id": str(reg["event_id"]),
        "user_id": str(reg["user_id"]),
        "qr_code": reg["qr_code"],
        "checked_in": reg.get("checked_in", False),
    }

def serialize_teacher(t) -> dict:
    return {
        "id": str(t["_id"]),
        "name": t["name"],
        "mobile": t["mobile"],
        "email": t["email"],
        "club_id": str(t["club_id"]) if t.get("club_id") else None,
    }

# ----------------- Event Functions -----------------
async def list_events():
    events = await db[COLLECTION_EVENTS].find().sort("date", 1).to_list(100)
    return [serialize_event(e) for e in events]

async def get_event(event_id: str):
    try:
        event = await db[COLLECTION_EVENTS].find_one({"_id": ObjectId(event_id)})
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid event ID")
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    return serialize_event(event)

async def create_event(event_in: EventIn, created_by: str):
    if event_in.clubId:
        try:
            club = await db["clubs"].find_one({"_id": ObjectId(event_in.clubId)})
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid club ID")
        if not club:
            raise HTTPException(status_code=404, detail="Club not found")
        if not club.get("approved", False):
            raise HTTPException(status_code=403, detail="Club is not approved to host events")
    
    event_data = event_in.dict()
    event_data.update({
        "created_by": ObjectId(created_by),
        "created_at": datetime.utcnow()
    })
    if event_data.get("clubId"):
        event_data["clubId"] = ObjectId(event_data["clubId"])
    
    result = await db[COLLECTION_EVENTS].insert_one(event_data)
    new_event = await db[COLLECTION_EVENTS].find_one({"_id": result.inserted_id})
    return serialize_event(new_event)

async def update_event(event_id: str, event_in: EventIn, user_id: str, user_role: str = "club"):
    try:
        event = await db[COLLECTION_EVENTS].find_one({"_id": ObjectId(event_id)})
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid event ID")
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    if str(event["created_by"]) != user_id and user_role != "admin":
        raise HTTPException(status_code=403, detail="Not allowed to update this event")
    
    update_data = event_in.dict()
    update_data["updated_at"] = datetime.utcnow()
    if update_data.get("clubId"):
        update_data["clubId"] = ObjectId(update_data["clubId"])
    
    await db[COLLECTION_EVENTS].update_one({"_id": ObjectId(event_id)}, {"$set": update_data})
    updated_event = await db[COLLECTION_EVENTS].find_one({"_id": ObjectId(event_id)})
    return serialize_event(updated_event)

async def delete_event(event_id: str, user_id: str, user_role: str = "club"):
    try:
        event = await db[COLLECTION_EVENTS].find_one({"_id": ObjectId(event_id)})
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid event ID")
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    if str(event["created_by"]) != user_id and user_role != "admin":
        raise HTTPException(status_code=403, detail="Not allowed to delete this event")
    
    await db[COLLECTION_EVENTS].delete_one({"_id": ObjectId(event_id)})
    return {"message": "Event deleted successfully"}

# ----------------- Registration -----------------
async def register_for_event(event_id: str, user_id: str):
    # Prevent duplicate registration
    existing = await db[COLLECTION_REGISTRATIONS].find_one({
        "event_id": ObjectId(event_id),
        "user_id": ObjectId(user_id)
    })
    if existing:
        raise HTTPException(status_code=400, detail="Already registered")
    
    # Generate QR code
    qr_data = f"{event_id}_{user_id}"
    img = qrcode.make(qr_data)
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    qr_base64 = base64.b64encode(buf.getvalue()).decode()
    
    reg_data = {
        "event_id": ObjectId(event_id),
        "user_id": ObjectId(user_id),
        "qr_code": qr_base64,
        "checked_in": False
    }
    result = await db[COLLECTION_REGISTRATIONS].insert_one(reg_data)
    new_reg = await db[COLLECTION_REGISTRATIONS].find_one({"_id": result.inserted_id})
    return serialize_registration(new_reg)

async def checkin_registration(registration_id: str):
    reg = await db[COLLECTION_REGISTRATIONS].find_one({"_id": ObjectId(registration_id)})
    if not reg:
        raise HTTPException(status_code=404, detail="Registration not found")
    await db[COLLECTION_REGISTRATIONS].update_one(
        {"_id": ObjectId(registration_id)},
        {"$set": {"checked_in": True}}
    )
    reg["checked_in"] = True
    return serialize_registration(reg)

# ----------------- Teacher Functions -----------------
async def add_teacher(teacher_in: TeacherIn):
    teacher = teacher_in.dict()
    teacher["club_id"] = ObjectId(teacher["club_id"])
    result = await db[COLLECTION_TEACHERS].insert_one(teacher)
    new_teacher = await db[COLLECTION_TEACHERS].find_one({"_id": result.inserted_id})
    return serialize_teacher(new_teacher)

async def list_teachers_by_club(club_id: str):
    teachers = await db[COLLECTION_TEACHERS].find({"club_id": ObjectId(club_id)}).to_list(50)
    return [serialize_teacher(t) for t in teachers]

# ----------------- Routes -----------------
# Event CRUD
@router.get("/", response_model=List[EventOut])
async def get_events_route():
    return await list_events()

@router.get("/{event_id}", response_model=EventOut)
async def get_event_route(event_id: str):
    return await get_event(event_id)

@router.post("/", response_model=EventOut)
async def create_event_route(event_in: EventIn, user=Depends(require_role(["club","admin"]))):
    return await create_event(event_in, created_by=user["_id"])

@router.put("/{event_id}", response_model=EventOut)
async def update_event_route(event_id: str, event_in: EventIn, user=Depends(require_role(["club","admin"]))):
    return await update_event(event_id, event_in, user_id=user["_id"], user_role=user["role"])

@router.delete("/{event_id}")
async def delete_event_route(event_id: str, user=Depends(require_role(["club","admin"]))):
    return await delete_event(event_id, user_id=user["_id"], user_role=user["role"])

# Event Registration
@router.post("/{event_id}/register", response_model=RegistrationOut)
async def register_event_route(event_id: str, user=Depends(require_role(["student"]))):
    return await register_for_event(event_id, user["_id"])

@router.post("/checkin/{registration_id}", response_model=RegistrationOut)
async def checkin_route(registration_id: str, user=Depends(require_role(["club","admin"]))):
    return await checkin_registration(registration_id)

# Teacher Management
@router.post("/teachers", response_model=TeacherOut)
async def add_teacher_route(teacher: TeacherIn, user=Depends(require_role(["admin","club"]))):
    return await add_teacher(teacher)

@router.get("/teachers/{club_id}", response_model=List[TeacherOut])
async def get_club_teachers(club_id: str):
    return await list_teachers_by_club(club_id)

# Event Participants
@router.get("/{event_id}/participants", response_model=List[RegistrationOut])
async def get_event_participants(event_id: str, user=Depends(require_role(["club", "admin"]))):
    try:
        event_oid = ObjectId(event_id)
    except InvalidId:
        raise HTTPException(status_code=400, detail="Invalid event ID format")

    event = await db[COLLECTION_EVENTS].find_one({"_id": event_oid})
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    participants = []
    async for doc in db[COLLECTION_REGISTRATIONS].find({"event_id": event_oid}):
        participants.append(serialize_registration(doc))
    return participants

# Event Check-in by user ID
@router.post("/{event_id}/checkin/{user_id}")
async def check_in(event_id: str, user_id: str, user=Depends(require_role(["club", "admin"]))):
    registration = await db[COLLECTION_REGISTRATIONS].find_one({
        "event_id": ObjectId(event_id),
        "user_id": ObjectId(user_id)
    })
    if not registration:
        raise HTTPException(status_code=404, detail="Student not registered for this event")

    await db[COLLECTION_REGISTRATIONS].update_one(
        {"_id": registration["_id"]},
        {"$set": {"checked_in": True}}
    )
    return {"message": "Checked-in successfully"}
