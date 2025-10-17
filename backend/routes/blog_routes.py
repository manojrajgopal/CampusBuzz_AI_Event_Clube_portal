from fastapi import APIRouter, Depends, HTTPException
from datetime import datetime
from bson import ObjectId
from config.db import db
from utils.mongo_utils import sanitize_doc
from models.blog_model import BlogIn, BlogOut
from middleware.auth_middleware import require_role

router = APIRouter(prefix="/api/blogs", tags=["Blogs"])

COLLECTION = "blogs"

# Create Blog
@router.post("/", response_model=BlogOut)
async def create_blog(blog: BlogIn):
    blog_dict = blog.dict()
    blog_dict["created_at"] = datetime.utcnow()
    result = await db[COLLECTION].insert_one(blog_dict)
    blog_dict["_id"] = str(result.inserted_id)
    return blog_dict

# Get All Blogs
@router.get("/", response_model=list[BlogOut])
async def get_blogs():
    blogs = await db[COLLECTION].find().sort("created_at", -1).to_list(100)
    return [sanitize_doc(b) for b in blogs]

# Delete Blog
@router.delete("/{blog_id}")
async def delete_blog(blog_id: str, user=Depends(require_role(["admin", "club"]))):
    result = await db[COLLECTION].delete_one({"_id": ObjectId(blog_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Blog not found")
    return {"message": "Blog deleted"}
