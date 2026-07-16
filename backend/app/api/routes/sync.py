"""
同步相关 API 路由
"""

from fastapi import APIRouter, Depends, HTTPException, Request
import asyncpg

from app.db import get_connection
from app.services.auth import get_user_by_session_token
from app.services.pending_records import RecordType, get_user_pending_records
from app.services.sync_service import sync_record_to_database, sync_user_records
from app.redis import get_redis_client

router = APIRouter(prefix="/sync", tags=["sync"])


async def require_user_id(connection: asyncpg.Connection, request: Request) -> str:
    session = await get_user_by_session_token(connection, request.cookies.get("sm1_session"))
    user = session.get("user") if session else None

    if not isinstance(user, dict) or not user.get("id"):
        raise HTTPException(status_code=401, detail="请先登录")

    return str(user["id"])


@router.get("/pending")
async def get_pending_records(request: Request, connection: asyncpg.Connection = Depends(get_connection)):
    """获取待同步记录列表"""
    user_id = await require_user_id(connection, request)

    redis = get_redis_client()
    if not redis:
        return {"items": [], "count": 0, "redisAvailable": False}

    try:
        pending_records = await get_user_pending_records(user_id)
        return {
            "items": pending_records,
            "count": len(pending_records),
            "redisAvailable": True,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取待同步记录失败: {str(e)}")


@router.post("/records")
async def manual_sync(
    request: Request,
    connection: asyncpg.Connection = Depends(get_connection),
    record_id: str | None = None,
    record_type: RecordType | None = None,
):
    """手动同步记录"""
    user_id = await require_user_id(connection, request)

    redis = get_redis_client()
    if not redis:
        raise HTTPException(status_code=503, detail="本地缓存服务不可用")

    try:
        # 如果指定了单条记录,只同步该记录
        if record_id and record_type:
            result = await sync_record_to_database(record_type, record_id)

            if not result.success:
                raise HTTPException(status_code=500, detail=result.error or "同步失败")

            return {
                "success": True,
                "message": "记录已同步到云端",
                "synced": 1,
            }

        # 否则同步用户所有待上传记录
        results = await sync_user_records(user_id)
        success_count = sum(1 for r in results if r.success)

        return {
            "success": True,
            "message": f"已同步 {success_count} 条记录到云端",
            "synced": success_count,
            "failed": len(results) - success_count,
            "results": [r.to_dict() for r in results if not r.success],
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"同步失败: {str(e)}")
