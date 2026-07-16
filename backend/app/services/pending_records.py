"""
待同步记录管理服务

Redis 数据结构:
- pending:records:{type}:{id} - Hash: 记录完整数据
- pending:records:{type}:{id}:meta - Hash: 元数据(userId, createdAt, scheduledSyncAt)
- pending:records:queue - Sorted Set: 按 scheduledSyncAt 排序的待同步队列
- pending:records:user:{userId} - Set: 用户的待同步记录ID列表
"""

import json
import time
from typing import Any, Literal
from uuid import uuid4

from app.redis import get_redis_client

RecordType = Literal["bazi", "ziwei", "qimen", "liuyao", "tarot", "mbti"]

SYNC_DELAY_MS = 10 * 60 * 1000  # 10 minutes
RECORD_TTL_SECONDS = 24 * 60 * 60  # 24 hours


class PendingRecordMeta:
    def __init__(
        self,
        id: str,
        type: RecordType,
        user_id: str,
        created_at: str,
        scheduled_sync_at: int,
    ):
        self.id = id
        self.type = type
        self.user_id = user_id
        self.created_at = created_at
        self.scheduled_sync_at = scheduled_sync_at

    def to_dict(self) -> dict[str, Any]:
        return {
            "id": self.id,
            "type": self.type,
            "userId": self.user_id,
            "createdAt": self.created_at,
            "scheduledSyncAt": self.scheduled_sync_at,
        }


async def save_pending_record(
    type: RecordType,
    record_id: str,
    user_id: str,
    data: dict[str, Any],
) -> None:
    """保存待同步记录到 Redis"""
    redis = get_redis_client()
    if not redis:
        raise Exception("Redis not available")

    now = int(time.time() * 1000)
    scheduled_sync_at = now + SYNC_DELAY_MS

    meta = {
        "id": record_id,
        "type": type,
        "userId": user_id,
        "createdAt": data.get("created_at", ""),
        "scheduledSyncAt": str(scheduled_sync_at),
    }

    data_key = f"pending:records:{type}:{record_id}"
    meta_key = f"pending:records:{type}:{record_id}:meta"
    queue_key = "pending:records:queue"
    user_key = f"pending:records:user:{user_id}"

    async with redis.pipeline(transaction=True) as pipe:
        pipe.hset(data_key, "data", json.dumps(data))
        pipe.hset(meta_key, mapping=meta)
        pipe.zadd(queue_key, {f"{type}:{record_id}": scheduled_sync_at})
        pipe.sadd(user_key, f"{type}:{record_id}")
        pipe.expire(data_key, RECORD_TTL_SECONDS)
        pipe.expire(meta_key, RECORD_TTL_SECONDS)
        await pipe.execute()


async def get_pending_record(type: RecordType, record_id: str) -> dict[str, Any] | None:
    """获取待同步记录"""
    redis = get_redis_client()
    if not redis:
        return None

    data_key = f"pending:records:{type}:{record_id}"
    meta_key = f"pending:records:{type}:{record_id}:meta"

    data_result = await redis.hget(data_key, "data")
    meta_result = await redis.hgetall(meta_key)

    if not data_result or not meta_result:
        return None

    return {
        "meta": meta_result,
        "data": json.loads(data_result),
    }


async def delete_pending_record(type: RecordType, record_id: str, user_id: str) -> None:
    """删除待同步记录"""
    redis = get_redis_client()
    if not redis:
        return

    data_key = f"pending:records:{type}:{record_id}"
    meta_key = f"pending:records:{type}:{record_id}:meta"
    queue_key = "pending:records:queue"
    user_key = f"pending:records:user:{user_id}"

    async with redis.pipeline(transaction=True) as pipe:
        pipe.delete(data_key)
        pipe.delete(meta_key)
        pipe.zrem(queue_key, f"{type}:{record_id}")
        pipe.srem(user_key, f"{type}:{record_id}")
        await pipe.execute()


async def get_user_pending_records(user_id: str) -> list[dict[str, Any]]:
    """获取用户所有待同步记录"""
    redis = get_redis_client()
    if not redis:
        return []

    user_key = f"pending:records:user:{user_id}"
    record_ids = await redis.smembers(user_key)

    if not record_ids:
        return []

    results = []
    for record_id in record_ids:
        type_str, id_str = record_id.split(":", 1)
        meta_key = f"pending:records:{type_str}:{id_str}:meta"
        meta_result = await redis.hgetall(meta_key)

        if meta_result:
            results.append({
                "id": meta_result.get("id"),
                "type": meta_result.get("type"),
                "userId": meta_result.get("userId"),
                "createdAt": meta_result.get("createdAt"),
                "scheduledSyncAt": int(meta_result.get("scheduledSyncAt", 0)),
            })

    return results


async def get_due_records(limit: int = 100) -> list[str]:
    """获取到期待同步的记录(用于后台任务)"""
    redis = get_redis_client()
    if not redis:
        return []

    queue_key = "pending:records:queue"
    now = int(time.time() * 1000)

    return await redis.zrangebyscore(queue_key, 0, now, start=0, num=limit)


async def is_pending_record(type: RecordType, record_id: str) -> bool:
    """检查记录是否在本地缓存中"""
    redis = get_redis_client()
    if not redis:
        return False

    meta_key = f"pending:records:{type}:{record_id}:meta"
    return await redis.exists(meta_key) > 0
