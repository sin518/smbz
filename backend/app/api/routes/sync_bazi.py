"""八字记录同步端点 - 支持 Redis 本地缓存和延迟同步"""
from fastapi import APIRouter, HTTPException, Request, status
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
import json
import uuid
from datetime import datetime

from app.redis import get_redis_client

router = APIRouter()


class BaziChartSyncRequest(BaseModel):
    """八字排盘同步请求"""
    localId: str = Field(..., description="前端本地记录 ID")
    name: str = Field(..., max_length=100)
    gender: str = Field(..., pattern="^(male|female)$")
    birthTime: str
    calendar: str = Field(..., pattern="^(solar|lunar|pillars)$")
    location: Optional[str] = None
    longitude: Optional[float] = None
    latitude: Optional[float] = None
    useSolarTime: bool = False
    chartJson: Dict[str, Any] = Field(..., description="完整排盘 JSON")


class BaziChartSyncResponse(BaseModel):
    """同步响应"""
    serverId: str
    syncedAt: str
    cached: bool = Field(..., description="是否写入了 Redis 缓存")


@router.post("/sync/bazi", response_model=BaziChartSyncResponse)
async def sync_bazi_chart(request: Request, data: BaziChartSyncRequest):
    """
    八字记录同步端点

    工作流程:
    1. 先写入 Redis 缓存(立即返回)
    2. 后台异步写入 Supabase(如果失败,下次再试)
    3. 返回服务端 ID
    """
    from app.auth import get_auth_context

    # 鉴权(可选 - 未登录也允许缓存,但不会持久化)
    auth = await get_auth_context(request)
    user_id = auth.user.id if auth.user else None

    # 生成服务端 ID
    server_id = str(uuid.uuid4())
    synced_at = datetime.utcnow().isoformat()

    # 准备缓存数据
    cache_data = {
        "id": server_id,
        "localId": data.localId,
        "userId": user_id,
        "name": data.name,
        "gender": data.gender,
        "birthTime": data.birthTime,
        "calendar": data.calendar,
        "location": data.location,
        "longitude": data.longitude,
        "latitude": data.latitude,
        "useSolarTime": data.useSolarTime,
        "chartJson": data.chartJson,
        "syncedAt": synced_at,
        "status": "cached"  # cached -> pending -> synced
    }

    redis = get_redis_client()
    cached = False

    if redis:
        try:
            # 写入 Redis 缓存(7 天过期)
            cache_key = f"bazi:pending:{server_id}"
            await redis.setex(
                cache_key,
                7 * 24 * 60 * 60,  # 7 天
                json.dumps(cache_data, ensure_ascii=False)
            )

            # 添加到待同步队列
            if user_id:
                await redis.sadd(f"bazi:sync-queue:{user_id}", server_id)

            cached = True
        except Exception as e:
            # Redis 失败不影响主流程,记录日志即可
            print(f"Redis cache failed: {e}")

    # 如果已登录,立即尝试写入数据库(异步,不阻塞返回)
    if user_id and auth.supabase:
        try:
            # 这里可以用后台任务,现在先同步写入
            result = auth.supabase.table("bazi_charts").insert({
                "id": server_id,
                "user_id": user_id,
                "name": data.name,
                "gender": data.gender,
                "birth_time": data.birthTime,
                "calendar": data.calendar,
                "location": data.location,
                "longitude": data.longitude,
                "latitude": data.latitude,
                "use_solar_time": data.useSolarTime,
                "chart_json": data.chartJson
            }).execute()

            # 更新 Redis 状态为已同步
            if redis and cached:
                cache_data["status"] = "synced"
                await redis.setex(
                    f"bazi:pending:{server_id}",
                    7 * 24 * 60 * 60,
                    json.dumps(cache_data, ensure_ascii=False)
                )
                # 从待同步队列移除
                await redis.srem(f"bazi:sync-queue:{user_id}", server_id)

        except Exception as e:
            # 数据库写入失败,保留在 Redis 等待重试
            print(f"Database sync failed, will retry: {e}")
            if redis and cached:
                cache_data["status"] = "pending"
                cache_data["error"] = str(e)
                await redis.setex(
                    f"bazi:pending:{server_id}",
                    7 * 24 * 60 * 60,
                    json.dumps(cache_data, ensure_ascii=False)
                )

    return BaziChartSyncResponse(
        serverId=server_id,
        syncedAt=synced_at,
        cached=cached
    )


@router.get("/sync/bazi/status")
async def get_bazi_sync_status(request: Request):
    """
    获取当前用户的八字同步状态

    返回:
    - pending: 待同步的记录数
    - cached: Redis 中缓存的记录数
    """
    from app.auth import require_user_context

    auth = await require_user_context(request)
    user_id = auth.user.id

    redis = get_redis_client()

    if not redis:
        return {
            "pending": 0,
            "cached": 0,
            "redisAvailable": False
        }

    try:
        # 获取待同步队列
        pending_ids = await redis.smembers(f"bazi:sync-queue:{user_id}")
        pending_count = len(pending_ids) if pending_ids else 0

        return {
            "pending": pending_count,
            "cached": pending_count,
            "redisAvailable": True
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Redis error: {str(e)}"
        )


@router.post("/sync/bazi/retry")
async def retry_failed_bazi_syncs(request: Request):
    """
    重试失败的同步任务

    遍历用户的待同步队列,尝试写入数据库
    """
    from app.auth import require_user_context

    auth = await require_user_context(request)
    user_id = auth.user.id

    redis = get_redis_client()

    if not redis:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Redis 不可用"
        )

    try:
        # 获取待同步记录
        pending_ids = await redis.smembers(f"bazi:sync-queue:{user_id}")

        if not pending_ids:
            return {
                "retried": 0,
                "succeeded": 0,
                "failed": 0
            }

        succeeded = 0
        failed = 0

        for server_id in pending_ids:
            try:
                # 读取缓存数据
                cache_key = f"bazi:pending:{server_id}"
                cached_data = await redis.get(cache_key)

                if not cached_data:
                    # 缓存已过期,从队列移除
                    await redis.srem(f"bazi:sync-queue:{user_id}", server_id)
                    continue

                data = json.loads(cached_data)

                # 尝试写入数据库
                auth.supabase.table("bazi_charts").insert({
                    "id": data["id"],
                    "user_id": user_id,
                    "name": data["name"],
                    "gender": data["gender"],
                    "birth_time": data["birthTime"],
                    "calendar": data["calendar"],
                    "location": data.get("location"),
                    "longitude": data.get("longitude"),
                    "latitude": data.get("latitude"),
                    "use_solar_time": data["useSolarTime"],
                    "chart_json": data["chartJson"]
                }).execute()

                # 成功,更新状态
                data["status"] = "synced"
                await redis.setex(cache_key, 7 * 24 * 60 * 60, json.dumps(data, ensure_ascii=False))
                await redis.srem(f"bazi:sync-queue:{user_id}", server_id)
                succeeded += 1

            except Exception as e:
                print(f"Retry failed for {server_id}: {e}")
                failed += 1

        return {
            "retried": len(pending_ids),
            "succeeded": succeeded,
            "failed": failed
        }

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"重试失败: {str(e)}"
        )
