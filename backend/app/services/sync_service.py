"""
记录同步服务

负责将 Redis 缓存的记录同步到 PostgreSQL
"""

from typing import Any, Literal

from app.db import acquire_connection
from app.services.pending_records import (
    RecordType,
    delete_pending_record,
    get_pending_record,
    get_user_pending_records,
)


class SyncResult:
    def __init__(self, success: bool, record_id: str, type: RecordType, error: str | None = None):
        self.success = success
        self.record_id = record_id
        self.type = type
        self.error = error

    def to_dict(self) -> dict[str, Any]:
        result = {
            "success": self.success,
            "recordId": self.record_id,
            "type": self.type,
        }
        if self.error:
            result["error"] = self.error
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


async def sync_record_to_database(record_type: RecordType, record_id: str) -> SyncResult:
    """同步单条记录到数据库"""
    try:
        pending = await get_pending_record(record_type, record_id)
        if not pending:
            return SyncResult(
                success=False,
                record_id=record_id,
                type=record_type,
                error="Record not found in cache",
            )

        table_name = get_table_name(record_type)
        if not table_name:
            return SyncResult(
                success=False,
                record_id=record_id,
                type=record_type,
                error=f"Unknown record type: {record_type}",
            )

        data = pending["data"]
        user_id = pending["meta"]["userId"]

        # 构建插入语句
        columns = list(data.keys())
        placeholders = [f"${i+1}" for i in range(len(columns))]
        values = [data[col] for col in columns]

        query = f"""
            INSERT INTO {table_name} ({', '.join(columns)})
            VALUES ({', '.join(placeholders)})
        """

        async with acquire_connection() as conn:
            await conn.execute(query, *values)

        # 同步成功,删除 Redis 缓存
        await delete_pending_record(record_type, record_id, user_id)

        return SyncResult(success=True, record_id=record_id, type=record_type)

    except Exception as e:
        return SyncResult(
            success=False,
            record_id=record_id,
            type=record_type,
            error=str(e),
        )


async def sync_records_batch(records: list[dict[str, str]]) -> list[SyncResult]:
    """批量同步记录"""
    results = []
    for record in records:
        result = await sync_record_to_database(
            record["type"],  # type: ignore
            record["id"],
        )
        results.append(result)
    return results


async def sync_user_records(user_id: str) -> list[SyncResult]:
    """同步用户所有待上传记录"""
    pending_records = await get_user_pending_records(user_id)

    return await sync_records_batch(
        [{"type": r["type"], "id": r["id"]} for r in pending_records]
    )
