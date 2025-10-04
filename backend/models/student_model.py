# student_model.py
from pydantic import BaseModel, Field
from typing import List, Optional

class StudentProfileIn(BaseModel):
    name: str
    email: str
    mobile: str
    USN_id: str
    department: str
    year: str
    skills: List[str] = Field(default_factory=list)
    interests: List[str] = Field(default_factory=list)
    achievements: List[str] = Field(default_factory=list)
    description: Optional[str] = None

class StudentProfileOut(StudentProfileIn):
    user_id: str
