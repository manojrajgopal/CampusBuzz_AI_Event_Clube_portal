from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Optional
from bson import ObjectId
from bson.errors import InvalidId
from datetime import datetime
import qrcode, io, base64

from config.db import db
from models.event_model import EventIn, EventOut, RegistrationOut
from middleware.auth_middleware import require_role, get_current_user

router = APIRouter(prefix="/api/events", tags=["events"])

COLLECTION_EVENTS = "events"
COLLECTION_REGISTRATIONS = "event_registrations"

# ----------------- Routes -----------------
# Event CRUD
@router.get("/", response_model=List[EventOut])
async def get_events_route(clubId: Optional[str] = Query(None)):
    query = {}
    if clubId:
        try:
            query["clubId"] = ObjectId(clubId)
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid clubId")
    events = await db[COLLECTION_EVENTS].find(query).sort("date", 1).to_list(100)
    
    result = []
    for event in events:
        event_data = {
            "id": str(event["_id"]),
            "title": event["title"],
            "description": event["description"],
            "venue": event["venue"],
            "date": event["date"],
            "tags": event.get("tags", []),
            "poster": event.get("poster"),
            "isPaid": event.get("isPaid", False),
            "clubId": str(event.get("clubId")) if event.get("clubId") else None,
            "clubName": event.get("clubName"),
            "created_by": str(event["created_by"]),
            "created_at": event["created_at"],
            "updated_at": event.get("updated_at"),
        }
        result.append(event_data)
    return result

@router.get("/{event_id}", response_model=EventOut)
async def get_event_route(event_id: str):
    try:
        event = await db[COLLECTION_EVENTS].find_one({"_id": ObjectId(event_id)})
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid event ID")
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
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
        "clubName": event.get("clubName"),
        "created_by": str(event["created_by"]),
        "created_at": event["created_at"],
        "updated_at": event.get("updated_at"),
    }

@router.post("/")
async def create_event_route(event_in: EventIn):
    print(event_in)

    # Use a fixed user ID since no authorization
    user_id = "64f123456789abcdef123456"  # replace with a valid ObjectId string

    event_data = event_in.dict()
    event_data.update({
        "created_by": ObjectId(user_id),
        "created_at": datetime.utcnow()
    })

    if event_data.get("clubId"):
        event_data["clubId"] = ObjectId(event_data["clubId"])

    result = await db[COLLECTION_EVENTS].insert_one(event_data)
    new_event = await db[COLLECTION_EVENTS].find_one({"_id": result.inserted_id})
    
    return {
        "id": str(new_event["_id"]),
        "title": new_event["title"],
        "description": new_event["description"],
        "venue": new_event["venue"],
        "date": new_event["date"],
        "tags": new_event.get("tags", []),
        "poster": new_event.get("poster"),
        "isPaid": new_event.get("isPaid", False),
        "clubId": str(new_event.get("clubId")) if new_event.get("clubId") else None,
        "clubName": new_event.get("clubName"),
        "created_by": str(new_event["created_by"]),
        "created_at": new_event["created_at"],
        "updated_at": new_event.get("updated_at"),
    }

@router.put("/{event_id}", response_model=EventOut)
async def update_event_route(event_id: str, event_in: EventIn, user=Depends(require_role(["club","admin"]))):
    try:
        event = await db[COLLECTION_EVENTS].find_one({"_id": ObjectId(event_id)})
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid event ID")
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    if str(event["created_by"]) != user["_id"] and user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Not allowed to update this event")
    
    update_data = event_in.dict()
    update_data["updated_at"] = datetime.utcnow()
    if update_data.get("clubId"):
        update_data["clubId"] = ObjectId(update_data["clubId"])
    
    await db[COLLECTION_EVENTS].update_one({"_id": ObjectId(event_id)}, {"$set": update_data})
    updated_event = await db[COLLECTION_EVENTS].find_one({"_id": ObjectId(event_id)})
    
    return {
        "id": str(updated_event["_id"]),
        "title": updated_event["title"],
        "description": updated_event["description"],
        "venue": updated_event["venue"],
        "date": updated_event["date"],
        "tags": updated_event.get("tags", []),
        "poster": updated_event.get("poster"),
        "isPaid": updated_event.get("isPaid", False),
        "clubId": str(updated_event.get("clubId")) if updated_event.get("clubId") else None,
        "clubName": updated_event.get("clubName"),
        "created_by": str(updated_event["created_by"]),
        "created_at": updated_event["created_at"],
        "updated_at": updated_event.get("updated_at"),
    }

@router.delete("/{event_id}")
async def delete_event(event_id: str):
    result = await db[COLLECTION_EVENTS].delete_one({"_id": ObjectId(event_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Event not found")
    return {"message": "Event deleted successfully"}

# Event Registration
@router.post("/{event_id}/register", response_model=RegistrationOut)
async def register_event_route(event_id: str, user=Depends(require_role(["student"]))):
    # Prevent duplicate registration
    existing = await db[COLLECTION_REGISTRATIONS].find_one({
        "event_id": ObjectId(event_id),
        "user_id": ObjectId(user["_id"])
    })
    if existing:
        raise HTTPException(status_code=400, detail="Already registered")
    
    # Generate QR code
    qr_data = f"{event_id}_{user['_id']}"
    img = qrcode.make(qr_data)
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    qr_base64 = base64.b64encode(buf.getvalue()).decode()
    
    reg_data = {
        "event_id": ObjectId(event_id),
        "user_id": ObjectId(user["_id"]),
        "qr_code": qr_base64,
        "checked_in": False
    }
    result = await db[COLLECTION_REGISTRATIONS].insert_one(reg_data)
    new_reg = await db[COLLECTION_REGISTRATIONS].find_one({"_id": result.inserted_id})
    
    return {
        "id": str(new_reg["_id"]),
        "event_id": str(new_reg["event_id"]),
        "user_id": str(new_reg["user_id"]),
        "qr_code": new_reg["qr_code"],
        "checked_in": new_reg.get("checked_in", False),
    }

@router.post("/checkin/{registration_id}", response_model=RegistrationOut)
async def checkin_route(registration_id: str, user=Depends(require_role(["club","admin"]))):
    reg = await db[COLLECTION_REGISTRATIONS].find_one({"_id": ObjectId(registration_id)})
    if not reg:
        raise HTTPException(status_code=404, detail="Registration not found")
    await db[COLLECTION_REGISTRATIONS].update_one(
        {"_id": ObjectId(registration_id)},
        {"$set": {"checked_in": True}}
    )
    reg["checked_in"] = True
    
    return {
        "id": str(reg["_id"]),
        "event_id": str(reg["event_id"]),
        "user_id": str(reg["user_id"]),
        "qr_code": reg["qr_code"],
        "checked_in": reg.get("checked_in", False),
    }

# Event Participants
@router.get("/{event_id}/participants", response_model=List[dict])
async def get_event_participants(event_id: str):
    try:
        event_oid = ObjectId(event_id)
    except InvalidId:
        raise HTTPException(status_code=400, detail="Invalid event ID format")

    event = await db[COLLECTION_EVENTS].find_one({"_id": event_oid})
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    participants = []
    async for doc in db[COLLECTION_REGISTRATIONS].find({"event_id": event_oid}):
        user_doc = await db["users"].find_one({"_id": doc["user_id"]})
        user_name = user_doc.get("name") if user_doc else None

        participants.append({
            "_id": str(doc["_id"]),
            "id": str(doc["_id"]),
            "event_id": str(doc["event_id"]),
            "user_id": str(doc["user_id"]),
            "name": user_name,
            "qr_code": doc["qr_code"],
            "checked_in": doc.get("checked_in", False),
        })

    print(participants)
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