from fastapi import APIRouter, Depends, HTTPException
from datetime import datetime
from bson import ObjectId
from config.db import db
from utils.mongo_utils import sanitize_doc
from models.blog_model import BlogIn, BlogOut
from middleware.auth_middleware import require_role
import base64
import uuid
import os

router = APIRouter(prefix="/api/blogs", tags=["Blogs"])

COLLECTION = "blogs"

# Create Blog
@router.post("/", response_model=BlogOut)
async def create_blog(blog: BlogIn):
    blog_dict = blog.dict()
    blog_dict["created_at"] = datetime.utcnow()
    
    # Handle base64 media data
    if blog_dict.get("media") and blog_dict.get("mediaType") in ["image", "video"]:
        # If it's base64 data, you might want to store it as is or process it
        # For large files, consider storing in a file system or cloud storage
        if blog_dict["media"].startswith('data:'):
            # Extract the base64 data
            media_data = blog_dict["media"].split(',')[1]
            # You can decode and store as binary or keep as base64 string
            # For now, we'll store as base64 string
            pass
    
    result = await db[COLLECTION].insert_one(blog_dict)
    blog_dict["_id"] = str(result.inserted_id)
    return blog_dict

# Get All Blogs
@router.get("/", response_model=list[BlogOut])
async def get_blogs():
    blogs = await db[COLLECTION].find().sort("created_at", -1).to_list(100)
    return [sanitize_doc(b) for b in blogs]

# Update Blog
@router.put("/{blog_id}", response_model=BlogOut)
async def update_blog(blog_id: str, blog: BlogIn):
    blog_dict = blog.dict()
    blog_dict["updated_at"] = datetime.utcnow()
    
    # Handle base64 media data (same as create)
    if blog_dict.get("media") and blog_dict.get("mediaType") in ["image", "video"]:
        if blog_dict["media"].startswith('data:'):
            # Process base64 data if needed
            pass
    
    result = await db[COLLECTION].update_one(
        {"_id": ObjectId(blog_id)},
        {"$set": blog_dict}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Blog not found")
    
    updated_blog = await db[COLLECTION].find_one({"_id": ObjectId(blog_id)})
    return sanitize_doc(updated_blog)

# Delete Blog
@router.delete("/{blog_id}")
async def delete_blog(blog_id: str):
    result = await db[COLLECTION].delete_one({"_id": ObjectId(blog_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Blog not found")
    return {"message": "Blog deleted"}