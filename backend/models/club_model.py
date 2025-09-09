# backend/models/club_model.py
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

class ClubIn(BaseModel):
    name: str = Field(..., min_length=3, max_length=50)
    description: str = Field(..., min_length=5)

class ClubOut(ClubIn):
    id: str
    created_by: str
    members: List[str] = []
    created_at: datetime
    approved: bool = False
