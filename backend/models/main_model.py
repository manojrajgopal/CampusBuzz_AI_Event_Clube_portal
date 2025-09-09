# backend/models/main_model.py
from pydantic import BaseModel
from typing import Optional

class MainPageContent(BaseModel):
    home: str
    events: str
    blogs: str
    contact: str
    address: str
