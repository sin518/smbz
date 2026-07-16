"""
定时同步任务 API
"""

from fastapi import APIRouter, Header, HTTPException

from app.core.config import get_settings
from app.services.pending_records import get_due_records
from app.services.sync_service import sync_records_batch
from app.redis import get_redis_client

router = APIRouter(prefix="/cron", tags=["cron"])


@router.get("/sync-records")
async def cron_sync_records(authorization: str = Header(None)):
    """定时同步任务 - 每分钟检查并同步到期的记录"""
    settings = get_settings()

    # 验证 Cron Secret (需要在 .env 中添加 CRON_SECRET)
    if not authorization or authorization != f"Bearer {getattr(settings, 'cron_secret', '')}":
        raise HTTPException(status_code=401, detail="Unauthorized")

    # 检查 Redis 是否可用
    redis = get_redis_client()
    if not redis:
        raise HTTPException(status_code=503, detail="Redis not available")

    try:
        # 获取到期的记录
        due_record_ids = await get_due_records(limit=100)

        if not due_record_ids:
            return {"synced": 0, "message": "No records due for sync"}

        # 解析记录ID
        records = []
        for record_id in due_record_ids:
            parts = record_id.split(":", 1)
            if len(parts) == 2:
                records.append({"type": parts[0], "id": parts[1]})

        # 批量同步
        results = await sync_records_batch(records)

        success_count = sum(1 for r in results if r.success)
        failed_count = len(results) - success_count

        print(f"[Sync Task] Synced {success_count}/{len(results)} records")

        return {
            "synced": success_count,
            "failed": failed_count,
            "total": len(results),
            "results": [r.to_dict() for r in results if not r.success],  # 只返回失败的
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Sync task failed: {str(e)}")
