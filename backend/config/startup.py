from fastapi import FastAPI
from config.db import db
from passlib.context import CryptContext
from datetime import datetime

# Password context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

async def create_default_admin():
    admin_email = "admin@gmail.com"  # must match curl
    existing = await db["users"].find_one({"email": admin_email})
    if not existing:
        admin_user = {
            "name": "Admin User",
            "email": admin_email,
            "password_hash": pwd_context.hash("AdminPass123"),  # hashed password
            "role": "admin",
            "created_at": datetime.utcnow()
        }
        result = await db["users"].insert_one(admin_user)
    else:
        return

async def test_connection():
    try:
        await db.command("ping")
    except Exception:
        return

def register_startup_events(app: FastAPI):
    @app.on_event("startup")
    async def startup_tasks():
        await test_connection()
        await create_default_admin()
