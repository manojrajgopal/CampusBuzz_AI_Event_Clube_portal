# backend/routes/club_routes.py
from fastapi import APIRouter, Depends, HTTPException, Request
from typing import List
from bson import ObjectId
from datetime import datetime
from passlib.context import CryptContext
from bson.errors import InvalidId
import json
from models.club_model import (
    ClubIn,
    ClubOut,
    JoinClubApplication,
    CreateClubApplication,
    TeacherIn,
    TeacherOut,
)
from middleware.auth_middleware import require_role, get_current_user
from config.db import db
from utils.mongo_utils import sanitize_doc
from utils.id_util import normalize_id
from pymongo.errors import PyMongoError
import os
import httpx
from dotenv import load_dotenv
from fastapi.encoders import jsonable_encoder

router = APIRouter(prefix="/api/clubs", tags=["clubs"])

# ----------------- Collections & Password -----------------
COLLECTION = "clubs"
COLLECTION_JOIN = "club_join_applications"
COLLECTION_CREATE = "club_create_applications"
COLLECTION_TEACHERS = "teachers"
USERS_COLLECTION = "users"

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

load_dotenv()
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

# ----------------- Helpers -----------------
def validate_object_id(id_str: str) -> ObjectId:
    """Ensure the given string is a valid MongoDB ObjectId."""
    if not ObjectId.is_valid(id_str):
        raise HTTPException(status_code=400, detail=f"Invalid ObjectId: {id_str}")
    return ObjectId(id_str)

def serialize_club(club) -> dict:
    return {
        "id": str(club["_id"]),
        "name": club["name"],
        "description": club.get("description", ""),
        "created_by": str(club["created_by"]),
        "members": [str(m) for m in club.get("members", [])],
        "created_at": club["created_at"].isoformat(),
        "approved": club.get("approved", False),
        "email": club.get("email", ""),
        "leader_id": str(club.get("leader_id", "")),
        "subleader": club.get("subleader", {}),
    }

# ----------------- Core Club Functions -----------------
async def list_clubs():
    clubs = await db[COLLECTION].find({"approved": True}).to_list(100)
    result = []
    for c in clubs:
        serialized = serialize_club(c)
        serialized["teachers"] = await list_teachers_by_club(serialized["id"])
        result.append(serialized)
    return result

async def create_club(club_in: ClubIn, created_by: str):
    club_data = club_in.dict()
    club_data.update({
        "created_by": normalize_id(created_by),
        "members": [],
        "created_at": datetime.utcnow(),
        "approved": False,
    })
    result = await db[COLLECTION].insert_one(club_data)
    new_club = await db[COLLECTION].find_one({"_id": result.inserted_id})
    return serialize_club(new_club)

async def approve_club(club_id: str):
    oid = normalize_id(club_id)
    club = await db[COLLECTION].find_one({"_id": oid})
    if not club:
        raise HTTPException(status_code=404, detail="Club not found")
    await db[COLLECTION].update_one({"_id": oid}, {"$set": {"approved": True}})
    updated_club = await db[COLLECTION].find_one({"_id": oid})
    return serialize_club(updated_club)

async def reject_club(club_id: str):
    oid = normalize_id(club_id)
    club = await db[COLLECTION].find_one({"_id": oid})
    if not club:
        raise HTTPException(status_code=404, detail="Club not found")
    await db[COLLECTION].update_one({"_id": oid}, {"$set": {"approved": False}})
    updated_club = await db[COLLECTION].find_one({"_id": oid})
    return serialize_club(updated_club)

async def join_club(club_id: str, user_id: str):
    oid = normalize_id(club_id)
    club = await db[COLLECTION].find_one({"_id": oid})
    if not club or not club.get("approved", False):
        raise HTTPException(status_code=404, detail="Club not found or not approved")

    user_oid = normalize_id(user_id)
    if user_oid in club.get("members", []):
        raise HTTPException(status_code=400, detail="Already a member")

    await db[COLLECTION].update_one({"_id": oid}, {"$push": {"members": user_oid}})
    updated_club = await db[COLLECTION].find_one({"_id": oid})
    return serialize_club(updated_club)

async def leave_club(club_id: str, user_id: str):
    oid = normalize_id(club_id)
    club = await db[COLLECTION].find_one({"_id": oid})
    if not club or not club.get("approved", False):
        raise HTTPException(status_code=404, detail="Club not found or not approved")

    user_oid = normalize_id(user_id)
    if user_oid not in club.get("members", []):
        raise HTTPException(status_code=400, detail="Not a member")

    await db[COLLECTION].update_one({"_id": oid}, {"$pull": {"members": user_oid}})
    updated_club = await db[COLLECTION].find_one({"_id": oid})
    return serialize_club(updated_club)

# Gemini API helper - FIXED VERSION
async def enhance_with_gemini(description: str, purpose: str):
    """
    Enhance club description and purpose using Gemini and classify club type.
    Returns enhanced data without storing anything in database.
    """
    if not description or not purpose:
        return {
            "enhanced_description": description,
            "enhanced_purpose": purpose,
            "type": "General"
        }
    
    if not GEMINI_API_KEY:
        # If no API key, return original data
        return {
            "enhanced_description": description,
            "enhanced_purpose": purpose,
            "type": "General"
        }

    # --- Gemini enhancement ---
    prompt = f"""
    Enhance the following club details professionally and classify the club type.

    Description: {description}
    Purpose: {purpose}

    Return a valid JSON only with these keys:
    - enhanced_description (make it professional and engaging, 2-3 sentences)
    - enhanced_purpose (make it clear and impactful, 2-3 sentences)  
    - type (one or two words max, e.g. 'Technical', 'Sports', 'Cultural', 'Literature', 'Entrepreneurship', 'Music', etc.)

    Make the enhancement professional and suitable for a university club.
    """

    model = "gemini-2.5-flash-lite"
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"
    headers = {"Content-Type": "application/json"}
    payload = {"contents": [{"parts": [{"text": prompt}]}]}

    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{url}?key={GEMINI_API_KEY}", 
                headers=headers, 
                json=payload,
                timeout=30.0
            )

        if response.status_code != 200:
            print(f"Gemini API error: {response.status_code} - {response.text}")
            return {
                "enhanced_description": description,
                "enhanced_purpose": purpose,
                "type": "General"
            }

        data = response.json()
        text_response = data["candidates"][0]["content"]["parts"][0]["text"]
        
        # Clean the response - remove markdown code blocks if present
        text_response = text_response.strip()
        if text_response.startswith("```json"):
            text_response = text_response[7:]
        if text_response.endswith("```"):
            text_response = text_response[:-3]
        text_response = text_response.strip()
        
        enhanced = json.loads(text_response)
        
        # Validate the enhanced data has required fields
        if not all(key in enhanced for key in ["enhanced_description", "enhanced_purpose", "type"]):
            raise ValueError("Missing required fields in Gemini response")
            
        return enhanced
        
    except Exception as e:
        print(f"Error enhancing with Gemini: {str(e)}")
        # Return original data if Gemini fails
        return {
            "enhanced_description": description,
            "enhanced_purpose": purpose,
            "type": "General"
        }
    
# ----------------- Applications -----------------
async def apply_join_club(application: JoinClubApplication, user_id: str):
    app_data = application.dict()
    app_data["user_id"] = normalize_id(user_id)
    result = await db[COLLECTION_JOIN].insert_one(app_data)
    app = await db[COLLECTION_JOIN].find_one({"_id": result.inserted_id})
    app["id"] = str(app["_id"])
    return app

async def apply_create_club(application, user_id: str):
    """
    Enhanced version of apply_create_club:
    - Uses Gemini for enhancement.
    - Fetches leader/subleader details.
    - Validates leader/subleader existence.
    """

    app_data = application.dict()
    app_data["user_id"] = normalize_id(user_id)

    # ✅ 1. Validate leader & subleader existence
    leader = await db["student_profiles"].find_one({"USN_id": app_data.get("leader_USN_id")})
    subleader = await db["student_profiles"].find_one({"USN_id": app_data.get("subleader_USN_id")})

    if not leader:
        raise HTTPException(status_code=404, detail=f"Leader with USN {app_data.get('leader_USN_id')} not found")
    if not subleader:
        raise HTTPException(status_code=404, detail=f"Subleader with USN {app_data.get('subleader_USN_id')} not found")

    # ✅ 2. Enhance with Gemini
    enhancement = await enhance_with_gemini(
        description=app_data.get("description", ""),
        purpose=app_data.get("purpose", "")
    )

    # ✅ 3. Merge enhanced data and leader/subleader info
    app_data.update({
        "description": enhancement.get("enhanced_description", app_data.get("description")),
        "purpose": enhancement.get("enhanced_purpose", app_data.get("purpose")),
        "type": enhancement.get("type", "General"),
        "leader_data": leader,
        "subleader_data": subleader,
        "applied_at": datetime.utcnow(),
        "status": "pending"
    })

    # ✅ 4. Insert into collection
    result = await db["club_create_applications"].insert_one(app_data)
    inserted_app = await db["club_create_applications"].find_one({"_id": result.inserted_id})

    # ✅ 5. Format final response
    inserted_app["id"] = str(inserted_app["_id"])
    inserted_app["user_id"] = str(inserted_app["user_id"])
    
    # Convert ObjectId fields to strings for JSON serialization
    response_data = jsonable_encoder(inserted_app, custom_encoder={ObjectId: str})
    
    return response_data

async def list_pending_club_applications():
    apps = []
    async for doc in db[COLLECTION_CREATE].find({}):
        doc["id"] = str(doc["_id"])
        doc["_id"] = str(doc["_id"])
        if "user_id" in doc and isinstance(doc["user_id"], ObjectId):
            doc["user_id"] = str(doc["user_id"])
        apps.append(doc)
    return apps

# ----------------- Join Requests Management -----------------
async def list_join_requests(club_id: str):
    requests = []
    async for doc in db[COLLECTION_JOIN].find({"club_id": normalize_id(club_id)}):
        doc["id"] = str(doc["_id"])
        doc["_id"] = str(doc["_id"])
        doc["user_id"] = str(doc["user_id"])

        # Fetch student details
        user = await db[USERS_COLLECTION].find_one(
            {"_id": normalize_id(doc["user_id"])},
            {"_id": 0, "name": 1, "email": 1}
        )
        if user:
            doc["name"] = user.get("name", "Unknown")
            doc["email"] = user.get("email", "N/A")
        else:
            doc["name"] = "Unknown"
            doc["email"] = "N/A"

        requests.append(doc)
    return requests

async def reject_join_request(request_id: str):
    req = await db[COLLECTION_JOIN].find_one({"_id": normalize_id(request_id)})
    if not req:
        raise HTTPException(status_code=404, detail="Join request not found")

    await db[COLLECTION_JOIN].delete_one({"_id": normalize_id(request_id)})
    return {"status": "rejected", "user_id": str(req["user_id"])}

async def approve_club_application(application_id: str, admin_id: str):
    app = await db[COLLECTION_CREATE].find_one({"_id": normalize_id(application_id)})
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")

    # Create club user in USERS_COLLECTION for login
    existing = await db[USERS_COLLECTION].find_one({"email": app["club_email"]})
    if existing:
        raise HTTPException(status_code=400, detail="Club email already in use")

    password_hash = pwd_context.hash(app["club_password"])

    club_user_doc = {
        "name": app["club_name"],
        "email": app["club_email"],
        "password_hash": password_hash,
        "role": "club",
        "created_at": datetime.utcnow(),
    }
    result_user = await db[USERS_COLLECTION].insert_one(club_user_doc)
    club_user_id = result_user.inserted_id

    # Create the club in clubs collection
    club_doc = {
        "name": app.get("club_name"),
        "description": app.get("description", ""),
        "purpose": app.get("purpose", ""),
        "type": app.get("type", "General"),
        "email": app.get("club_email"),
        "leader_id": normalize_id(app["user_id"]),
        "leader_data": app.get("leader_data", {}),
        "subleader": {
            "name": app.get("subleader_data", {}).get("name", ""),
            "email": app.get("subleader_data", {}).get("email", ""),
            "USN_id": app.get("subleader_USN_id", "")
        },
        "created_at": datetime.utcnow(),
        "approved": True,
        "members": [normalize_id(app["user_id"])],
        "created_by": normalize_id(admin_id),
        "requests": []
    }

    # Insert into clubs collection
    result_club = await db[COLLECTION].insert_one(club_doc)
    club_id = result_club.inserted_id

    # Remove the original application
    await db[COLLECTION_CREATE].delete_one({"_id": normalize_id(application_id)})

    return {
        "message": "✅ Club approved successfully", 
        "club_user_id": str(club_user_id),
        "club_id": str(club_id)
    }

async def reject_club_application(app_id: str):
    oid = normalize_id(app_id)
    result = await db[COLLECTION_CREATE].delete_one({"_id": oid})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Application not found")
    return {"status": "rejected"}

# ----------------- Teachers -----------------
async def add_teacher(teacher: dict):
    if not all(k in teacher for k in ["name", "mobile", "email", "club_id"]):
        raise HTTPException(status_code=400, detail="Missing teacher fields")

    teacher["club_id"] = normalize_id(teacher["club_id"])
    result = await db[COLLECTION_TEACHERS].insert_one(teacher)
    teacher["id"] = str(result.inserted_id)
    teacher["club_id"] = str(teacher["club_id"])
    return teacher

async def list_teachers_by_club(club_id: str):
    teachers = []
    async for doc in db[COLLECTION_TEACHERS].find({"club_id": normalize_id(club_id)}):
        doc["id"] = str(doc["_id"])
        doc["_id"] = str(doc["_id"])
        doc["club_id"] = str(doc["club_id"])
        teachers.append(doc)
    return teachers

# ----------------- Routes -----------------
@router.get("/")
async def getClubs():
    try:
        print("Getting Clubs")
        cursor = db["clubs"].find({})
        clubs_list = []

        async for club in cursor:
            clubs_list.append({
                "id": str(club["_id"]),
                "name": club.get("name", "")
            })

        print(clubs_list)
        return clubs_list
    except Exception as e:
        print("Error fetching clubs:", e)
        return {"error": "Failed to fetch clubs"}

def convert_objectid(data):
    if isinstance(data, list):
        return [convert_objectid(item) for item in data]
    elif isinstance(data, dict):
        return {k: convert_objectid(v) for k, v in data.items()}
    elif isinstance(data, ObjectId):
        return str(data)
    elif isinstance(data, datetime):
        return data.isoformat()
    else:
        return data
    
@router.get("/applications", dependencies=[Depends(require_role(["admin"]))])
async def get_pending_applications():
    try:
        apps = await db["club_create_applications"].find({}).to_list(length=None)

        # Recursively convert ObjectIds and datetimes
        converted_apps = [convert_objectid(app) for app in apps]

        return converted_apps
    except Exception as e:
        print(f"Error fetching applications: {e}")
        raise HTTPException(status_code=500, detail="Error fetching applications")

@router.get("/{club_id}")
async def get_club(club_id: str):
    try:
        club = await db.clubs.find_one({"_id": ObjectId(club_id)})

        if not club:
            raise HTTPException(status_code=404, detail="Club not found")
        
        club = sanitize_doc(club)

        # Map Mongo fields to Pydantic fields
        club["id"] = str(club.pop("_id"))  # ✅ Pydantic expects `id`
        club["description"] = club.get("description", "No description provided")
        club["created_by"] = str(club.get("created_by", "unknown"))

        # Get leader info
        club["leader"] = await db.users.find_one(
            {"_id": ObjectId(club.get("leader_id"))}, 
            {"_id": 0, "name": 1, "email": 1, "mobile": 1}
        ) if club.get("leader_id") else None

        print("Here")
        # Convert members ObjectIds to names
        requests_final = []
        for r in club.get("requests", []):
            try:
                # If it's a valid ObjectId, fetch user info
                if ObjectId.is_valid(str(r)):
                    user = await db.users.find_one(
                        {"_id": ObjectId(r)},
                        {"_id": 0, "name": 1, "email": 1}
                    )
                    if user:
                        requests_final.append({
                            "id": str(r),
                            "name": user.get("name", "Unknown"),
                            "email": user.get("email", "N/A")
                        })
                    else:
                        requests_final.append({"id": str(r), "name": "Unknown", "email": "N/A"})
                else:
                    # Already a plain string (fallback/manual entry)
                    requests_final.append({"id": None, "name": str(r), "email": None})
            except InvalidId:
                requests_final.append({"id": None, "name": str(r), "email": None})

        club["requests"] = requests_final

        # Convert members ObjectIds to names
        members_final = []
        for m in club.get("members", []):
            if ObjectId.is_valid(str(m)):
                user = await db.users.find_one(
                    {"_id": ObjectId(m)},
                    {"_id": 0, "name": 1, "email": 1}
                )
                if user:
                    members_final.append({
                        "id": str(m),
                        "name": user.get("name", "Unknown"),
                        "email": user.get("email", "N/A")
                    })
            else:
                members_final.append({"id": None, "name": str(m), "email": None})

        club["members"] = members_final

        teachers_final = []
        for t in club.get("teachers", []):
            try:
                if ObjectId.is_valid(t):  # t is already a string
                    user = await db.teachers.find_one(
                        {"_id": ObjectId(t)},   # convert string to ObjectId
                        {"_id": 0, "name": 1, "email": 1}
                    )
                    print(user)
                    if user:
                        teachers_final.append({
                            "id": str(t),
                            "name": user.get("name", "Unknown"),
                            "email": user.get("email", "N/A")
                        })
                    else:
                        teachers_final.append({"id": str(t), "name": "Unknown", "email": "N/A"})
                else:
                    teachers_final.append({"id": None, "name": str(t), "email": None})
            except Exception as e:
                print("Error processing teacher:", str(e))
                teachers_final.append({"id": None, "name": str(t), "email": None})

        club["teachers"] = teachers_final

        club["created_at"] = club.get("created_at") or datetime.utcnow()

        print(club)
        print("To here")
        return club

    except Exception as e:
        print("Error in get_club:", str(e))
        raise HTTPException(status_code=400, detail="Invalid club ID")

# Student Applications
@router.post("/apply/join")
async def join_club_application(request: Request, user=Depends(get_current_user)):
    try:
        # 1️⃣ Get JSON body from frontend
        data = await request.json()
        club_id = data.get("club_id")
        if not club_id:
            raise HTTPException(status_code=400, detail="club_id is required")

        club_obj_id = ObjectId(club_id)
        user_obj_id = ObjectId(user["_id"])

        # 2️⃣ Find the club
        club = await db["clubs"].find_one({"_id": club_obj_id})
        if not club:
            raise HTTPException(status_code=404, detail="Club not found")

        # 3️⃣ Check if user is already a member
        if "members" in club and user_obj_id in club["members"]:
            return {"message": "You are already a member", "club_id": club_id, "user_id": user["_id"]}

        # 4️⃣ Add user to members
        result = await db["clubs"].update_one(
            {"_id": club_obj_id},
            {"$push": {"requests": user_obj_id}}  # safe now, because we already checked
        )

        return {"message": "Successfully joined the club", "club_id": club_id, "user_id": user["_id"]}

    except PyMongoError as e:
        raise HTTPException(status_code=500, detail=str(e))

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
# Student applies to create a new club
@router.post("/apply/create")
async def create_club_application(
    application: CreateClubApplication,
    user=Depends(require_role(["student", "admin"]))
):
    return await apply_create_club(application, user["_id"])

@router.post("/applications/{app_id}/approve", dependencies=[Depends(require_role(["admin"]))])
async def approve_application(app_id: str, user=Depends(require_role(["admin"]))):
    try:
        print(f"DEBUG: Received approve request for app_id={app_id}, user={user}")

        # ✅ Convert to ObjectId safely inside route
        if not ObjectId.is_valid(app_id):
            print(f"DEBUG: Invalid ObjectId detected: {app_id}")
            raise HTTPException(status_code=400, detail="Invalid application ID")
        app_oid = ObjectId(app_id)
        print(f"DEBUG: Converted app_id to ObjectId: {app_oid}")

        # Fetch application
        app = await db[COLLECTION_CREATE].find_one({"_id": app_oid})
        print(f"DEBUG: Fetched application from DB: {app}")
        if not app:
            print("DEBUG: Application not found in database")
            raise HTTPException(status_code=404, detail="Application not found")

        # Check if club email exists
        existing = await db[USERS_COLLECTION].find_one({"email": app["club_email"]})
        print(f"DEBUG: Existing user check for email {app['club_email']}: {existing}")
        if existing:
            print("DEBUG: Club email already in use")
            raise HTTPException(status_code=400, detail="Club email already in use")

        password_hash = pwd_context.hash(app["club_password"])
        print(f"DEBUG: Hashed password for new club user")

        club_user_doc = {
            "name": app["club_name"],
            "email": app["club_email"],
            "password_hash": password_hash,
            "role": "club",
            "created_at": datetime.utcnow(),
        }
        print(f"DEBUG: Prepared club user document: {club_user_doc}")

        result_user = await db[USERS_COLLECTION].insert_one(club_user_doc)
        club_user_id = result_user.inserted_id
        print(f"DEBUG: Inserted club user into DB, user_id={club_user_id}")

        # Create the club
        club_doc = {
            "name": app.get("club_name"),
            "description": app.get("description", ""),
            "purpose": app.get("purpose", ""),
            "type": app.get("type", "General"),
            "email": app.get("club_email"),
            "leader_id": ObjectId(app["user_id"]),
            "leader_data": app.get("leader_data", {}),
            "subleader": {
                "name": app.get("subleader_data", {}).get("name", ""),
                "email": app.get("subleader_data", {}).get("email", ""),
                "USN_id": app.get("subleader_USN_id", "")
            },
            "created_at": datetime.utcnow(),
            "approved": True,
            "members": [ObjectId(app["user_id"])],
            "created_by": ObjectId(user["_id"]),
            "requests": []
        }
        print(f"DEBUG: Prepared club document: {club_doc}")

        result_club = await db[COLLECTION].insert_one(club_doc)
        club_id = result_club.inserted_id
        print(f"DEBUG: Inserted club into DB with id={club_id}")

        # Remove original application
        await db[COLLECTION_CREATE].delete_one({"_id": app_oid})
        print(f"DEBUG: Deleted original application with id={app_oid}")

        return {
            "message": "✅ Club approved successfully", 
            "club_user_id": str(club_user_id),
            "club_id": str(club_id)
        }

    except Exception as e:
        print("Error approving application:", e)
        raise HTTPException(status_code=400, detail="Failed to approve application")

@router.delete("/applications/{app_id}/reject", dependencies=[Depends(require_role(["admin"]))])
async def reject_application(app_id: str):
    return await reject_club_application(app_id)

# Club Creation
@router.post("/", response_model=ClubOut)
async def create_club_route(club_in: ClubIn, user=Depends(require_role(["student", "club", "admin"]))):
    return await create_club(club_in, user["_id"])

# Admin Approval for Clubs
@router.put("/{club_id}/approve", response_model=ClubOut)
async def approve_club_route(club_id: str, user=Depends(require_role(["admin"]))):
    return await approve_club(str(validate_object_id(club_id)))

@router.put("/{club_id}/reject", response_model=ClubOut)
async def reject_club_route(club_id: str, user=Depends(require_role(["admin"]))):
    return await reject_club(str(validate_object_id(club_id)))

# Student Join / Leave
@router.post("/{club_id}/join", response_model=ClubOut)
async def join_club_route(club_id: str, user=Depends(require_role(["student"]))):
    return await join_club(str(validate_object_id(club_id)), user["_id"])

@router.post("/{club_id}/leave", response_model=ClubOut)
async def leave_club_route(club_id: str, user=Depends(require_role(["student"]))):
    return await leave_club(str(validate_object_id(club_id)), user["_id"])

# Teachers
@router.get("/{club_id}/teachers", response_model=List[TeacherOut])
async def get_club_teachers_route(club_id: str):
    return await list_teachers_by_club(str(validate_object_id(club_id)))

# Club Leader/Admin – Manage Join Requests
@router.get("/{club_id}/join-requests", dependencies=[Depends(require_role(["club", "admin"]))])
async def get_join_requests(club_id: str):
    return await list_join_requests(club_id)

@router.post("/{club_id}/join-requests/{request_id}/approve")
async def approve_request_route(club_id: str, request_id: str):
    print("Approving...")
    club = await db[COLLECTION].find_one({"_id": normalize_id(club_id)})
    if not club:
        raise HTTPException(status_code=404, detail="Club not found")

    # Remove from requests and add to members
    await db[COLLECTION].update_one(
        {"_id": normalize_id(club_id)},
        {
            "$pull": {"requests": normalize_id(request_id)},
            "$addToSet": {"members": normalize_id(request_id)}
        }
    )

    return {
        "status": "approved",
        "club_id": club_id,
        "user_id": request_id
    }

@router.post("/{club_id}/join-requests/{request_id}/reject")
async def reject_request_route(club_id: str, request_id: str):
    print("Rejecting...")
    club = await db[COLLECTION].find_one({"_id": normalize_id(club_id)})
    if not club:
        raise HTTPException(status_code=404, detail="Club not found")

    # Just remove from requests
    await db[COLLECTION].update_one(
        {"_id": normalize_id(club_id)},
        {"$pull": {"requests": normalize_id(request_id)}}
    )

    return {
        "status": "rejected",
        "club_id": club_id,
        "user_id": request_id
    }