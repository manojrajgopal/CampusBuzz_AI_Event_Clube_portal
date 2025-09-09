# backend/models/user_model.py
from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
import datetime

class UserRegister(BaseModel):
    name: str = Field(..., min_length=2, max_length=50)
    email: EmailStr
    password: str = Field(..., min_length=6)
    role: str = Field(..., pattern="^(student|club|admin)$")


class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    name: str
    email: EmailStr
    role: str
    created_at: datetime.datetime

class UserBase(BaseModel):
    name: str
    email: EmailStr
    password: str

class UserSignup(UserBase):
    role: str  # "student", "club", "admin"

class UserOut(BaseModel):
    id: str
    name: str
    email: str
    role: str

# Optional: For student profile creation
class StudentSignup(UserSignup):
    pass