from fastapi import APIRouter, Depends, HTTPException
from typing import List
from bson import ObjectId
from datetime import datetime
from config.db import db
from models.event_model import EventIn, EventOut
from middleware.auth_middleware import require_role

router = APIRouter(prefix="/api/events", tags=["events"])

COLLECTION = "events"

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


# ----------------- Core Event Functions -----------------
async def list_events():
    events = await db[COLLECTION].find().sort("date", 1).to_list(100)
    return [serialize_event(e) for e in events]


async def get_event(event_id: str):
    try:
        event = await db[COLLECTION].find_one({"_id": ObjectId(event_id)})
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid event ID")
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    return serialize_event(event)


async def create_event(event_in: EventIn, created_by: str):
    event_data = event_in.dict()
    event_data.update({
        "created_by": ObjectId(created_by),
        "created_at": datetime.utcnow(),
    })
    result = await db[COLLECTION].insert_one(event_data)
    new_event = await db[COLLECTION].find_one({"_id": result.inserted_id})
    return serialize_event(new_event)


async def update_event(event_id: str, event_in: EventIn, user_id: str, user_role: str = "club"):
    try:
        event = await db[COLLECTION].find_one({"_id": ObjectId(event_id)})
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid event ID")
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    # Only creator or admin can update
    if str(event["created_by"]) != user_id and user_role != "admin":
        raise HTTPException(status_code=403, detail="Not allowed to update this event")

    update_data = event_in.dict()
    update_data["updated_at"] = datetime.utcnow()
    await db[COLLECTION].update_one({"_id": ObjectId(event_id)}, {"$set": update_data})

    updated_event = await db[COLLECTION].find_one({"_id": ObjectId(event_id)})
    return serialize_event(updated_event)


async def delete_event(event_id: str, user_id: str, user_role: str = "club"):
    try:
        event = await db[COLLECTION].find_one({"_id": ObjectId(event_id)})
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid event ID")
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    # Only creator or admin can delete
    if str(event["created_by"]) != user_id and user_role != "admin":
        raise HTTPException(status_code=403, detail="Not allowed to delete this event")

    await db[COLLECTION].delete_one({"_id": ObjectId(event_id)})
    return {"message": "Event deleted successfully"}


# ----------------- Routes -----------------
# Public routes
@router.get("/", response_model=List[EventOut])
async def get_events_route():
    return await list_events()


@router.get("/{event_id}", response_model=EventOut)
async def get_event_route(event_id: str):
    return await get_event(event_id)


# Club/Admin routes
@router.post("/", response_model=EventOut)
async def create_event_route(event_in: EventIn, user=Depends(require_role(["club", "admin"]))):
    return await create_event(event_in, created_by=user["_id"])


@router.put("/{event_id}", response_model=EventOut)
async def update_event_route(event_id: str, event_in: EventIn, user=Depends(require_role(["club", "admin"]))):
    return await update_event(event_id, event_in, user_id=user["_id"], user_role=user["role"])


@router.delete("/{event_id}")
async def delete_event_route(event_id: str, user=Depends(require_role(["club", "admin"]))):
    return await delete_event(event_id, user_id=user["_id"], user_role=user["role"])
