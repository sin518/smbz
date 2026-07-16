"""
记录保存辅助函数

统一处理本地缓存和云端保存逻辑
"""

from datetime import datetime
from typing import Any
from uuid import uuid4

from app.db import acquire_connection
from app.redis import get_redis_client
from app.services.pending_records import RecordType, save_pending_record


class SaveRecordResult:
    def __init__(self, id: str, is_pending: bool, scheduled_sync_at: int | None = None):
        self.id = id
        self.is_pending = is_pending
        self.scheduled_sync_at = scheduled_sync_at

    def to_dict(self) -> dict[str, Any]:
        result = {"id": self.id, "isPending": self.is_pending}
        if self.scheduled_sync_at:
            result["scheduledSyncAt"] = self.scheduled_sync_at
        return result


def get_table_name(record_type: RecordType) -> str | None:
    """获取表名"""
    table_map = {
        "bazi": "bazi_charts",
        "ziwei": "ziwei_charts",
        "qimen": "qimen_charts",
        "liuyao": "liuyao_divinations",
        "tarot": "tarot_readings",
        "mbti": "mbti_readings",
    }
    return table_map.get(record_type)


async def save_record_with_cache(
    record_type: RecordType,
    user_id: str,
    data: dict[str, Any],
) -> SaveRecordResult:
    """
    保存记录(优先本地缓存,Redis 不可用时直接保存到云端)
    """
    # 生成记录 ID(如果没有提供)
    record_id = data.get("id") or str(uuid4())
    record_data = {**data, "id": record_id, "user_id": user_id}

    # 添加创建时间
    if "created_at" not in record_data:
        record_data["created_at"] = datetime.utcnow().isoformat()

    # 检查 Redis 是否可用
    redis = get_redis_client()

    if redis:
        # Redis 可用,保存到本地缓存
        try:
            import time
            await save_pending_record(record_type, record_id, user_id, record_data)
            scheduled_sync_at = int(time.time() * 1000) + 10 * 60 * 1000  # 10分钟后
            print(f"[SaveRecord] Saved to Redis cache: {record_type}:{record_id}")
            return SaveRecordResult(
                id=record_id,
                is_pending=True,
                scheduled_sync_at=scheduled_sync_at,
            )
        except Exception as e:
            print(f"[SaveRecord] Redis save failed, falling back to direct save: {e}")
            # Redis 保存失败,降级到直接保存

    # Redis 不可用或保存失败,直接保存到云端
    table_name = get_table_name(record_type)
    if not table_name:
        raise ValueError(f"Unknown record type: {record_type}")

    # 构建插入语句
    columns = list(record_data.keys())
    placeholders = [f"${i+1}" for i in range(len(columns))]
    values = [record_data[col] for col in columns]

    query = f"""
        INSERT INTO {table_name} ({', '.join(columns)})
        VALUES ({', '.join(placeholders)})
    """

    async with acquire_connection() as conn:
        await conn.execute(query, *values)

    print(f"[SaveRecord] Saved directly to database: {record_type}:{record_id}")

    return SaveRecordResult(id=record_id, is_pending=False)
