# club_model.py
from pydantic import BaseModel, Field, EmailStr
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
    image_base64: Optional[str] = None  # Add image_base64 field

class JoinClubApplication(BaseModel):
    name: str
    email: str
    mobile: str
    USN_id: str
    department: str
    interested: bool
    description: Optional[str] = None

class CreateClubApplication(BaseModel):
    club_name: str = Field(..., min_length=3, max_length=50)
    club_email: EmailStr
    club_password: str = Field(..., min_length=6)
    description: Optional[str] = None
    purpose: str = Field(..., min_length=4)
    leader_USN_id: str
    subleader_USN_id: str
    image_base64: Optional[str] = None  # Add image_base64 field

class TeacherIn(BaseModel):
    name: str
    mobile: str
    email: EmailStr
    club_id: str   # club assigned to

class TeacherOut(TeacherIn):
    id: str