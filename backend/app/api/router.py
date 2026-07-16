from fastapi import APIRouter

from app.api.routes import admin, ai_analysis, auth, bazi, health, profiles, sync, sync_bazi, cron


api_router = APIRouter(prefix="/api")
api_router.include_router(health.router)
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(profiles.router, prefix="/profiles", tags=["profiles"])
api_router.include_router(bazi.router, prefix="/bazi", tags=["bazi"])
api_router.include_router(ai_analysis.router, prefix="/ai", tags=["ai"])
api_router.include_router(admin.router, prefix="/admin", tags=["admin"])
api_router.include_router(sync.router, tags=["sync"])
api_router.include_router(sync_bazi.router, tags=["sync"])
api_router.include_router(cron.router, tags=["cron"])
