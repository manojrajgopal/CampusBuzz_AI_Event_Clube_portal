# backend/models/student_model.py
from pydantic import BaseModel, Field
from typing import List, Optional

class StudentProfileIn(BaseModel):
    name: str
    email: str
    mobile: str
    student_id: str
    department: str
    year: str
    skills: List[str] = []
    interests: List[str] = []
    achievements: List[str] = []
    description: Optional[str] = None

class StudentProfileOut(StudentProfileIn):
    user_id: str
