# backend/models/event_model.py
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

class EventIn(BaseModel):
    title: str = Field(..., example="AI Workshop")
    description: str = Field(..., example="Hands-on session on Machine Learning")
    date: datetime = Field(..., example="2025-09-10T10:00:00")
    venue: str = Field(..., example="Auditorium Hall")
    tags: Optional[List[str]] = []
    poster: Optional[str] = None  # URL of image (later Cloudinary/S3)
    isPaid: bool = False
    clubId: Optional[str] = None  # organizer/club reference

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
