# backend/models/event_model.py
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional
from datetime import datetime
 
# ---- Event Models ----

class EventIn(BaseModel):
    title: str = Field(..., example="AI Workshop")
    description: str = Field(..., example="Hands-on session on Machine Learning")
    date: datetime = Field(..., example="2025-09-10T10:00:00")
    venue: str = Field(..., example="Auditorium Hall")
    tags: Optional[List[str]] = []
    poster: Optional[str] = None
    isPaid: bool = False
    clubId: Optional[str] = None

class EventOut(BaseModel):
    id: str
    title: str
    description: str
    date: datetime
    venue: str
    tags: List[str]
    poster: Optional[str]
    isPaid: bool
    clubId: Optional[str]
    created_at: datetime

# ---- Registration Models ----

class RegistrationIn(BaseModel):
    event_id: str = Field(..., example="64f3a1c2e4a1b2c3d4e5f6b1")

class RegistrationOut(BaseModel):
    id: str
    event_id: str
    user_id: str
    qr_code: str   # base64 image string
    checked_in: bool = False




