"""
六爻记录同步端点 - 支持本地缓存和延迟同步
"""
from fastapi import APIRouter, Request, HTTPException
from pydantic import BaseModel, Field
from typing import Optional
import logging

from app.auth import get_auth_context
from app.redis import get_redis_client

logger = logging.getLogger(__name__)
router = APIRouter()


class LiuyaoSyncRequest(BaseModel):
    """六爻同步请求"""
    localId: str = Field(..., description="本地记录ID,用于幂等性")
    question: str = Field(..., description="占事问题")
    casting_method: str = Field(..., description="起卦方式")
    casting_time: str = Field(..., description="起卦时间")
    hexagram_data: dict = Field(..., description="卦象数据(input + casting)")
    created_at: str = Field(..., description="创建时间")


class LiuyaoSyncResponse(BaseModel):
    """六爻同步响应"""
    success: bool
    serverId: Optional[str] = None
    cached: bool = False
    message: str


@router.post("/sync/liuyao", response_model=LiuyaoSyncResponse)
async def sync_liuyao_record(request: Request, data: LiuyaoSyncRequest):
    """
    同步六爻记录到云端

    - 未登录: 缓存到 Redis
    - 已登录: 写入 Supabase liuyao_divinations 表
    """
    try:
        auth = await get_auth_context(request)
        redis_client = get_redis_client()

        # 1. 如果已登录,直接写入数据库
        if auth.user:
            try:
                result = await auth.supabase.table("liuyao_divinations").insert({
                    "user_id": auth.user.id,
                    "question": data.question,
                    "casting_method": data.casting_method,
                    "casting_time": data.casting_time,
                    "hexagram_data": data.hexagram_data,
                    "created_at": data.created_at
                }).execute()

                server_id = result.data[0]["id"] if result.data else None

                logger.info(f"六爻记录已同步到数据库: user_id={auth.user.id}, server_id={server_id}")

                return LiuyaoSyncResponse(
                    success=True,
                    serverId=server_id,
                    cached=False,
                    message="已同步到云端"
                )
            except Exception as db_error:
                logger.error(f"六爻记录写入数据库失败: {db_error}")
                raise HTTPException(status_code=500, detail=f"数据库写入失败: {str(db_error)}")

        # 2. 未登录,缓存到 Redis
        if redis_client:
            try:
                cache_key = f"liuyao:pending:{data.localId}"
                cache_value = data.model_dump_json()

                # 缓存 7 天
                await redis_client.setex(cache_key, 7 * 24 * 3600, cache_value)

                logger.info(f"六爻记录已缓存到 Redis: localId={data.localId}")

                return LiuyaoSyncResponse(
                    success=True,
                    serverId=None,
                    cached=True,
                    message="已缓存,登录后自动同步"
                )
            except Exception as redis_error:
                logger.error(f"六爻记录缓存到 Redis 失败: {redis_error}")
                raise HTTPException(status_code=500, detail=f"缓存失败: {str(redis_error)}")

        # 3. 既未登录也无 Redis
        return LiuyaoSyncResponse(
            success=False,
            serverId=None,
            cached=False,
            message="未登录且缓存不可用,请登录后重试"
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"六爻记录同步失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))
