from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class BlogIn(BaseModel):
    title: str
    content: str
    media: Optional[str] = None  # URL or file path for media
    mediaType: Optional[str] = "url"  # "url" or "file"

class BlogOut(BlogIn):
    id: str = Field(..., alias="_id")
    created_at: datetime
    author: Optional[str] = None
