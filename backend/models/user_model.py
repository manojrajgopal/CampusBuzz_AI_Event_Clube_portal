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
    password: Optional[str] = None  # Make optional for face login
    faceImage: Optional[str] = None  # Add for face authentication


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


# For student profile creation with face authentication
class StudentSignupRequest(BaseModel):
    name: str
    email: EmailStr
    password: str
    faceImage: Optional[str] = None  # Add for face registration


# For face login requests
class FaceLoginRequest(BaseModel):
    email: EmailStr
    faceImage: str


# Response model for face authentication
class FaceAuthResponse(BaseModel):
    status: str
    message: str
    access_token: Optional[str] = None
    role: Optional[str] = None
    user_id: Optional[str] = None
    name: Optional[str] = None