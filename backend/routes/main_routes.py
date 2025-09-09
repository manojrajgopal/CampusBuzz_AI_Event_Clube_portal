# backend/routes/main_routes.py
from fastapi import APIRouter
from controllers import main_controller

router = APIRouter(prefix="/api/main", tags=["main"])

@router.get("/")
async def get_main_page():
    return await main_controller.get_main_content()
