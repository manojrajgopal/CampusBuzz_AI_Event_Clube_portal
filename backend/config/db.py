# backend/config/db.py
from fastapi import FastAPI
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv
import asyncio
import logging
import asyncio

# Silence asyncio CancelledError globally (caused by uvicorn reload)
logging.getLogger("uvicorn.error").setLevel(logging.CRITICAL)
logging.getLogger("uvicorn.lifespan.on").setLevel(logging.CRITICAL)

# Suppress noisy CancelledError tracebacks
asyncio.get_event_loop().set_exception_handler(
    lambda loop, context: None if isinstance(context.get("exception"), asyncio.CancelledError) else loop.default_exception_handler(context)
)

load_dotenv()

client = AsyncIOMotorClient(os.getenv("MONGODB_URI"))
db = client[os.getenv("DB_NAME")]

def test_connection_sync():
    return client.admin.command("ping")

def create_app():
    app = FastAPI()

    @app.on_event("startup")
    async def startup_db_check():
        try:
            await client.admin.command("ping")
            print("✅ MongoDB connected")
        except asyncio.CancelledError:
            pass
        except Exception as e:
            print(f"❌ MongoDB connection failed: {e}")

    return app

app = create_app()
