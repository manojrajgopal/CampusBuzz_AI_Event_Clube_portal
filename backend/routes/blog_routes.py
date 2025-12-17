from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from datetime import datetime
from bson import ObjectId
from pathlib import Path
import shutil
from config.db import db
from utils.mongo_utils import sanitize_doc
from models.blog_model import BlogIn, BlogOut
from middleware.auth_middleware import require_role

router = APIRouter(prefix="/api/blogs", tags=["Blogs"])

COLLECTION = "blogs"
UPLOAD_DIR = Path("uploads/blogs")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

# Create Blog
@router.post("/", response_model=BlogOut)
async def create_blog(blog: BlogIn):
    blog_dict = blog.dict()
    blog_dict["created_at"] = datetime.utcnow()
    result = await db[COLLECTION].insert_one(blog_dict)
    blog_dict["_id"] = str(result.inserted_id)
    return blog_dict

# Update Blog
@router.put("/{blog_id}", response_model=BlogOut)
async def update_blog(
    blog_id: str,
    title: str = Form(...),
    content: str = Form(...),
    media: str = Form(None),
    mediaType: str = Form("url"),
    file: UploadFile = File(None),
    user=Depends(require_role(["admin", "club"]))
):
    # Check if blog exists and user has permission
    blog = await db[COLLECTION].find_one({"_id": ObjectId(blog_id)})
    if not blog:
        raise HTTPException(status_code=404, detail="Blog not found")

    update_dict = {
        "title": title,
        "content": content,
        "media": media,
        "mediaType": mediaType,
        "author": user.get("name", "Unknown")
    }

    if file:
        file_path = UPLOAD_DIR / f"{datetime.utcnow().timestamp()}_{file.filename}"
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        update_dict["media"] = str(file_path)
        update_dict["mediaType"] = "file"

    await db[COLLECTION].update_one({"_id": ObjectId(blog_id)}, {"$set": update_dict})
    updated_blog = await db[COLLECTION].find_one({"_id": ObjectId(blog_id)})
    return sanitize_doc(updated_blog)

# Get All Blogs
@router.get("/", response_model=list[BlogOut])
async def get_blogs():
    blogs = await db[COLLECTION].find().sort("created_at", -1).to_list(100)
    return [sanitize_doc(b) for b in blogs]

# Update Blog (JSON)
@router.put("/{blog_id}/json", response_model=BlogOut)
async def update_blog_json(blog_id: str, blog: BlogIn, user=Depends(require_role(["admin", "club"]))):
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
async def delete_blog(blog_id: str, user=Depends(require_role(["admin", "club"]))):
    result = await db[COLLECTION].delete_one({"_id": ObjectId(blog_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Blog not found")
    return {"message": "Blog deleted"}