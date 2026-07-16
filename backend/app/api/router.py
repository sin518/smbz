from fastapi import APIRouter

from app.api.routes import admin, ai_analysis, auth, bazi, cron, health, profiles, sync


api_router = APIRouter(prefix="/api")
api_router.include_router(health.router)
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(profiles.router, prefix="/profiles", tags=["profiles"])
api_router.include_router(bazi.router, prefix="/bazi", tags=["bazi"])
api_router.include_router(ai_analysis.router, prefix="/ai", tags=["ai"])
api_router.include_router(admin.router, prefix="/admin", tags=["admin"])
api_router.include_router(sync.router, tags=["sync"])
# 云端同步路由依赖尚未实现的 app.auth 鉴权模块。暂不加载，避免阻断登录和 AI 功能。
# 完成 Python 鉴权上下文与 Supabase 持久化后，再恢复这些路由。
api_router.include_router(cron.router, tags=["cron"])
