# db.py
import os
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

# Load .env.example instead of .env
load_dotenv()

# Extract MongoDB settings
MONGODB_URI = os.getenv("MONGODB_URI")
DB_NAME = os.getenv("DB_NAME", "campusbuzz")

# Initialize client
client = AsyncIOMotorClient(MONGODB_URI)
db = client[DB_NAME]

# 🔎 Test connection at startup
async def test_connection():
    try:
        await client.admin.command("ping")
        print("✅ Connected to MongoDB")
    except Exception as e:
        print("❌ MongoDB connection failed:", e)

# Run ping check when server starts
asyncio.get_event_loop().create_task(test_connection())
