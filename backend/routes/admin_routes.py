# admin_routes.py
from fastapi import APIRouter, HTTPException, Depends
from config.db import db
from bson import ObjectId
from middleware.auth_middleware import require_role
from datetime import datetime
from models.teacher_model import TeacherIn, TeacherOut
from routes.club_routes import serialize_club, list_teachers_by_club, get_club_teachers_route

router = APIRouter(prefix="/admin", tags=["Admin"])

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
            event_data = {}
            for k, v in event.items():
                if isinstance(v, ObjectId):
                    event_data[k] = str(v)
                elif isinstance(v, datetime):
                    event_data[k] = v.isoformat()
                else:
                    event_data[k] = v
            events.append(event_data)
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
@router.post("/teachers", response_model=TeacherOut, dependencies=[Depends(require_role(["admin"]))])
async def add_teacher_route(teacher: TeacherIn):
    teacher_data = teacher.dict()

    if not all(k in teacher_data for k in ["name", "mobile", "email", "club_id"]):
        raise HTTPException(status_code=400, detail="Missing teacher fields")

    # Normalize club_id (convert to ObjectId)
    try:
        teacher_data["club_id"] = ObjectId(teacher_data["club_id"])
    except:
        raise HTTPException(status_code=400, detail="Invalid club ID format")

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
            teacher_data = {}
            for k, v in t.items():
                if isinstance(v, ObjectId):
                    teacher_data[k] = str(v)
                elif isinstance(v, datetime):
                    teacher_data[k] = v.isoformat()
                else:
                    teacher_data[k] = v
            teachers.append(teacher_data)
        return teachers
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching teachers: {e}")

@router.put("/teachers/{teacher_id}", dependencies=[Depends(require_role(["admin"]))])
async def update_teacher(teacher_id: str, teacher_data: dict):
    print("teacher_id:", teacher_id)
    print("teacher_data:", teacher_data)

    # Update the club by adding teacher_id to its "teachers" list if club_name is provided
    if "club_id" in teacher_data:
        await db.clubs.update_one(
            {"name": teacher_data["club_id"]},  # match by club name
            {"$addToSet": {"teachers": teacher_id}}  # prevents duplicates
        )
        await db.teachers.update_one(
            {"_id": ObjectId(teacher_id)},
            {
                "$set": {
                    "club_name": teacher_data["club_id"]
                }
            }
        )
        return {"status": "ok", "message": "teacher saved completed"}

    return {"status": "ok", "message": "teacher already there"}

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
            participant_data = {}
            for k, v in p.items():
                if isinstance(v, ObjectId):
                    participant_data[k] = str(v)
                elif isinstance(v, datetime):
                    participant_data[k] = v.isoformat()
                else:
                    participant_data[k] = v
            participants.append(participant_data)
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