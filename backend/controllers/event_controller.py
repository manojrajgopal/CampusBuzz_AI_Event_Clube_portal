# backend/controllers/event_controller.py
from datetime import datetime
from bson import ObjectId
from fastapi import HTTPException
from config.db import db
from models.event_model import EventIn, EventOut

COLLECTION = "events"

def serialize_event(event) -> dict:
    return {
        "id": str(event["_id"]),
        "title": event["title"],
        "description": event["description"],
        "location": event["location"],
        "date": event["date"],
        "created_by": str(event["created_by"]),
        "created_at": event["created_at"],
        "updated_at": event.get("updated_at"),
    }

async def list_events():
    events = await db[COLLECTION].find().sort("date", 1).to_list(100)
    return [serialize_event(e) for e in events]

async def get_event(event_id: str):
    event = await db[COLLECTION].find_one({"_id": ObjectId(event_id)})
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

async def update_event(event_id: str, event_in: EventIn, user: dict):
    event = await db[COLLECTION].find_one({"_id": ObjectId(event_id)})
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    # Allow creator or admin
    if str(event["created_by"]) != user["_id"] and user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Not allowed to update this event")

    update_data = event_in.dict()
    update_data["updated_at"] = datetime.utcnow()

    await db[COLLECTION].update_one({"_id": ObjectId(event_id)}, {"$set": update_data})
    updated_event = await db[COLLECTION].find_one({"_id": ObjectId(event_id)})
    return serialize_event(updated_event)


async def delete_event(event_id: str, user_id: str):
    event = await db[COLLECTION].find_one({"_id": ObjectId(event_id)})
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    # Only creator or admin can delete
    if str(event["created_by"]) != user_id:
        raise HTTPException(status_code=403, detail="Not allowed to delete this event")

    await db[COLLECTION].delete_one({"_id": ObjectId(event_id)})
    return {"message": "Event deleted successfully"}
