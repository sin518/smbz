from fastapi import APIRouter

from app.api.routes import admin, auth, bazi, health, profiles


api_router = APIRouter(prefix="/api")
api_router.include_router(health.router)
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(profiles.router, prefix="/profiles", tags=["profiles"])
api_router.include_router(bazi.router, prefix="/bazi", tags=["bazi"])
api_router.include_router(admin.router, prefix="/admin", tags=["admin"])
