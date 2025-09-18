from fastapi import APIRouter, HTTPException, Depends
from config.db import db
from bson import ObjectId
from utils.id_util import normalize_id
from middleware.auth_middleware import require_role
from datetime import datetime
from routes.club_routes import serialize_club, list_teachers_by_club
from models.teacher_model import TeacherIn, TeacherOut


router = APIRouter(prefix="/admin", tags=["Admin"])


# Helper: safely convert MongoDB document to JSON
def safe_serialize(doc: dict):
    """Convert Mongo document to JSON-serializable dict"""
    new_doc = {}
    for k, v in doc.items():
        if isinstance(v, ObjectId):
            new_doc[k] = str(v)
        elif isinstance(v, datetime):
            new_doc[k] = v.isoformat()
        else:
            new_doc[k] = v
    return new_doc

from bson import ObjectId

def validate_object_id(id_str: str) -> ObjectId:
    """Validate and convert a string to ObjectId"""
    if not ObjectId.is_valid(id_str):
        raise ValueError("Invalid ObjectId")
    return ObjectId(id_str)




# --------------------------
# Clubs Management
# --------------------------
@router.get("/clubs")
async def get_all_clubs():
    clubs = []
    try:
        cursor = db.clubs.find({})
        async for club in cursor:
            # Serialize club like club_routes
            club_data = serialize_club(club)
            # Include teachers
            club_data["teachers"] = await list_teachers_by_club(club_data["id"])
            clubs.append(club_data)
        return clubs
    except Exception as e:
        print("Error fetching clubs:", str(e))
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/clubs/{club_id}/approve")
async def approve_club(club_id: str):
    if not ObjectId.is_valid(club_id):
        raise HTTPException(status_code=400, detail="Invalid club ID")
    result = await db.clubs.update_one(
        {"_id": ObjectId(club_id)},
        {"$set": {"approved": True}}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Club not found")
    return {"message": "✅ Club approved successfully"}

@router.delete("/clubs/{club_id}")
async def delete_club(club_id: str):
    if not ObjectId.is_valid(club_id):
        raise HTTPException(status_code=400, detail="Invalid club ID")
    result = await db.clubs.delete_one({"_id": ObjectId(club_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Club not found")
    return {"message": "❌ Club deleted"}


# --------------------------
# Events Management
# --------------------------
@router.get("/events")
async def get_all_events():
    try:
        events = []
        cursor = db.events.find({})
        async for event in cursor:
            events.append(safe_serialize(event))
        return events
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching events: {e}")


@router.put("/events/{event_id}/approve")
async def approve_event(event_id: str):
    if not ObjectId.is_valid(event_id):
        raise HTTPException(status_code=400, detail="Invalid event ID")
    result = await db.events.update_one(
        {"_id": ObjectId(event_id)},
        {"$set": {"approved": True}}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Event not found")
    return {"message": "✅ Event approved successfully"}

@router.delete("/events/{event_id}")
async def delete_event(event_id: str):
    if not ObjectId.is_valid(event_id):
        raise HTTPException(status_code=400, detail="Invalid event ID")
    result = await db.events.delete_one({"_id": ObjectId(event_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Event not found")
    return {"message": "❌ Event deleted"}


# --------------------------
# Teacher Management (Admin Only)
# --------------------------
# ✅ Add Teacher (moved from club_routes.py)
@router.post("/teachers", response_model=TeacherOut, dependencies=[Depends(require_role(["admin"]))])
async def add_teacher_route(teacher: TeacherIn):
    teacher_data = teacher.dict()

    if not all(k in teacher_data for k in ["name", "mobile", "email", "club_id"]):
        raise HTTPException(status_code=400, detail="Missing teacher fields")

    teacher_data["club_id"] = normalize_id(teacher_data["club_id"])
    result = await db["teachers"].insert_one(teacher_data)

    teacher_data["id"] = str(result.inserted_id)
    teacher_data["club_id"] = str(teacher_data["club_id"])
    return teacher_data



@router.get("/teachers", dependencies=[Depends(require_role(["admin"]))])
async def get_all_teachers():
    try:
        teachers = []
        cursor = db.teachers.find({})
        async for t in cursor:
            teachers.append(safe_serialize(t))
        return teachers
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching teachers: {e}")

@router.get("/teachers", dependencies=[Depends(require_role(["admin"]))])
async def get_all_teachers():
    teachers = []
    cursor = db.teachers.find({})
    async for t in cursor:
        t["_id"] = str(t["_id"])
        t["club_id"] = str(t["club_id"]) if "club_id" in t else None
        teachers.append(t)
    return teachers

@router.put("/teachers/{teacher_id}", dependencies=[Depends(require_role(["admin"]))])
async def update_teacher(teacher_id: str, teacher_data: dict):
    if not ObjectId.is_valid(teacher_id):
        raise HTTPException(status_code=400, detail="Invalid teacher ID")
    result = await db.teachers.update_one(
        {"_id": ObjectId(teacher_id)},
        {"$set": teacher_data}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Teacher not found")
    updated = await db.teachers.find_one({"_id": ObjectId(teacher_id)})
    updated["_id"] = str(updated["_id"])
    return updated

@router.delete("/teachers/{teacher_id}", dependencies=[Depends(require_role(["admin"]))])
async def delete_teacher(teacher_id: str):
    if not ObjectId.is_valid(teacher_id):
        raise HTTPException(status_code=400, detail="Invalid teacher ID")
    result = await db.teachers.delete_one({"_id": ObjectId(teacher_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Teacher not found")
    return {"message": "Teacher deleted successfully"}


# --------------------------
# Event Participants Management
# --------------------------
@router.get("/events/{event_id}/participants")
async def get_event_participants(event_id: str):
    if not ObjectId.is_valid(event_id):
        raise HTTPException(status_code=400, detail="Invalid event ID")
    participants = []
    try:
        async for p in db.event_participants.find({"event_id": ObjectId(event_id)}):
            participants.append(safe_serialize(p))  # ✅ use safe_serialize
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching participants: {e}")
    return participants


@router.post("/events/{event_id}/checkin/{participant_id}")
async def mark_participant_checkin(event_id: str, participant_id: str):
    if not ObjectId.is_valid(event_id) or not ObjectId.is_valid(participant_id):
        raise HTTPException(status_code=400, detail="Invalid IDs")
    result = await db.event_participants.update_one(
        {"_id": ObjectId(participant_id), "event_id": ObjectId(event_id)},
        {"$set": {"checked_in": True}}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Participant not found")
    return {"message": "✅ Participant checked-in successfully"}
