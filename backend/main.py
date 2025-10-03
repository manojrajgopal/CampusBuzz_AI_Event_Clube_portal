import uvicorn
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from middleware.auth_middleware import get_current_user, require_role
from routes import (auth_routes, 
                    event_routes,
                      club_routes, 
                      registration_routes, 
                      student_routes,
                       admin_routes,
                       chatbot_routes as chatbot_router)

from config.startup import register_startup_events  # Import startup tasks
from routes.blog_routes import router as blog_router



app = FastAPI(title="CampusBuzz API", version="0.1")

origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

# --- CORS middleware ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # in production, restrict origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Include routers ---
app.include_router(auth_routes.router)
app.include_router(event_routes.router)
app.include_router(club_routes.router)
app.include_router(registration_routes.router)
app.include_router(student_routes.router)
app.include_router(blog_router)
app.include_router(admin_routes.router, prefix="/api")  # Admin routes under /api/admin
app.include_router(chatbot_router.router)  # Chatbot routes


# --- Root endpoint --
@app.get("/")
async def root():
    return {"message": "CampusBuzz backend running. Hit /docs for API docs."}

# --- User profile endpoint ---
@app.get("/api/me")
async def get_profile(user=Depends(get_current_user)):
    return {"message": "Your profile", "user": user}

# --- Admin only endpoint ---
@app.get("/api/admin-only")
async def admin_area(user=Depends(require_role(["admin"]))):
    return {"message": "Welcome admin", "user": user}

# --- Register startup tasks (Mongo ping + default admin creation) ---
register_startup_events(app)

# --- Run server ---
if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
