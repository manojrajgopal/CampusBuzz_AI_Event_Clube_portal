from fastapi import APIRouter, Depends, HTTPException
from typing import List
from models.registration_model import RegistrationOut
from middleware.auth_middleware import require_role, get_current_user
# direct import of controller functions
from controllers.registration_controller import register_event, check_in_registration, list_registrations


router = APIRouter(prefix="/api/registrations", tags=["registrations"])

# register for event
@router.post("/register", response_model=RegistrationOut)
async def register_for_event(event_id: str, current_user: dict = Depends(get_current_user)):
    try:
        result = await register_event(event_id, current_user["_id"])  # use correct function
        return result
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
