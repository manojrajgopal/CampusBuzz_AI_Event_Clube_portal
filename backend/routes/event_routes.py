from fastapi import APIRouter, Depends
from typing import List

from models.event_model import EventIn, EventOut
from controllers import event_controller
from middleware.auth_middleware import require_role

router = APIRouter(prefix="/api/events", tags=["events"])

# Public routes
@router.get("/", response_model=List[EventOut])
async def get_events():
    return await event_controller.list_events()

@router.get("/{event_id}", response_model=EventOut)
async def get_event(event_id: str):
    return await event_controller.get_event(event_id)

# Club/Admin routes
@router.post("/", response_model=EventOut)
async def create_event(
    event_in: EventIn,
    user=Depends(require_role(["club", "admin"]))
):
    return await event_controller.create_event(event_in, created_by=user["_id"])

@router.put("/{event_id}", response_model=EventOut)
async def update_event(
    event_id: str,
    event_in: EventIn,
    user=Depends(require_role(["club", "admin"]))
):
    return await event_controller.update_event(
        event_id, event_in, user_id=user["_id"], user_role=user["role"]
    )

@router.delete("/{event_id}")
async def delete_event(
    event_id: str,
    user=Depends(require_role(["club", "admin"]))
):
    return await event_controller.delete_event(
        event_id, user_id=user["_id"], user_role=user["role"]
    )
