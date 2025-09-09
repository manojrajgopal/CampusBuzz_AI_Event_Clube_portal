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

class JoinClubApplication(BaseModel):
    name: str
    email: str
    mobile: str
    student_id: str
    department: str
    interested: bool
    description: Optional[str] = None

class CreateClubApplication(BaseModel):
    leader_name: str
    leader_email: str
    leader_mobile: str
    leader_student_id: str
    leader_department: str
    leader_year: Optional[str] = None
    leader_skills: List[str] = []
    leader_interests: List[str] = []
    leader_achievements: List[str] = []
    leader_description: Optional[str] = None

    subleader_name: str
    subleader_email: str
    subleader_mobile: str
    subleader_student_id: str
    subleader_department: str
    subleader_year: Optional[str] = None
    subleader_skills: List[str] = []
    subleader_interests: List[str] = []
    subleader_achievements: List[str] = []
    subleader_description: Optional[str] = None