# backend/main.py
import uvicorn
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from middleware.auth_middleware import get_current_user, require_role
from routes import auth_routes, event_routes, club_routes,registration_routes, student_routes 

app = FastAPI(title="CampusBuzz API", version="0.1")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # in production, restrict origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_routes.router)
app.include_router(event_routes.router)
app.include_router(club_routes.router)
app.include_router(registration_routes.router)
app.include_router(student_routes.router)

@app.get("/")
async def root():
    return {"message": "CampusBuzz backend running. Hit /docs for API docs."}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

@app.get("/api/me")
async def get_profile(user=Depends(get_current_user)):
    return {"message": "Your profile", "user": user}

@app.get("/api/admin-only")
async def admin_area(user=Depends(require_role(["admin"]))):
    return {"message": "Welcome admin", "user": user}

