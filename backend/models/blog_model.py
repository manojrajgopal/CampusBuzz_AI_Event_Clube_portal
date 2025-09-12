from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class BlogIn(BaseModel):
    title: str
    content: str
    image: Optional[str] = None  # URL for image

class BlogOut(BlogIn):
    id: str = Field(..., alias="_id")
    created_at: datetime
