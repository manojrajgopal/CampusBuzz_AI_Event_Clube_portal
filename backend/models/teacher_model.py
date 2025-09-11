# backend/models/teacher_model.py
from pydantic import BaseModel, EmailStr

class TeacherIn(BaseModel):
    name: str
    mobile: str
    email: EmailStr
    club_id: str   # club assigned to

class TeacherOut(TeacherIn):
    id: str
