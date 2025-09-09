# backend/models/registration_model.py
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class RegistrationIn(BaseModel):
    event_id: str

class RegistrationOut(BaseModel):
    id: str
    event_id: str
    user_id: str
    qr_code_data: str
    checked_in: bool
    registered_at: datetime
    checked_in_at: Optional[datetime] = None
