import json
from datetime import datetime
from uuid import uuid4

import asyncpg

from app.schemas.divination_records import DivinationRecordCloudItem, DivinationRecordSyncRequest, DivinationRecordType


async def upsert_divination_record(
    connection: asyncpg.Connection,
    user_id: str,
    record_type: DivinationRecordType,
    body: DivinationRecordSyncRequest,
) -> tuple[str, datetime, bool]:
    record_id = str(uuid4())
    payload_json = json.dumps(body.payload, ensure_ascii=False)
    row = await connection.fetchrow(
        '''
        INSERT INTO "DivinationRecord" (
          id, "userId", type, "localId", question, summary, detail, payload,
          "occurredAt", "createdAt", "updatedAt"
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9, NOW(), NOW())
        ON CONFLICT ("userId", type, "localId") DO UPDATE SET
          question = EXCLUDED.question,
          summary = EXCLUDED.summary,
          detail = EXCLUDED.detail,
          payload = EXCLUDED.payload,
          "occurredAt" = EXCLUDED."occurredAt",
          "updatedAt" = NOW()
        RETURNING id, "updatedAt", (xmax = 0) AS created
        ''',
        record_id,
        user_id,
        record_type,
        body.localId,
        body.question.strip(),
        body.summary.strip(),
        body.detail.strip(),
        payload_json,
        body.createdAt,
    )

    if not row:
        raise RuntimeError("保存占术记录失败")

    return str(row["id"]), row["updatedAt"], bool(row["created"])


async def list_divination_records(connection: asyncpg.Connection, user_id: str) -> list[DivinationRecordCloudItem]:
    rows = await connection.fetch(
        '''
        SELECT id, "localId", type, question, summary, detail, payload,
               "occurredAt", "updatedAt"
        FROM "DivinationRecord"
        WHERE "userId" = $1
        ORDER BY "occurredAt" DESC
        LIMIT 200
        ''',
        user_id,
    )
    return [
        DivinationRecordCloudItem(
            id=str(row["id"]),
            localId=str(row["localId"]),
            type=row["type"],
            question=row["question"],
            summary=row["summary"],
            detail=row["detail"],
            payload=normalize_payload(row["payload"]),
            createdAt=row["occurredAt"].isoformat(),
            updatedAt=row["updatedAt"].isoformat(),
        )
        for row in rows
    ]


async def delete_divination_record(connection: asyncpg.Connection, user_id: str, record_id: str) -> bool:
    result = await connection.execute(
        'DELETE FROM "DivinationRecord" WHERE id = $1 AND "userId" = $2',
        record_id,
        user_id,
    )
    return result == "DELETE 1"


async def delete_divination_records(
    connection: asyncpg.Connection,
    user_id: str,
    record_ids: list[str],
) -> tuple[list[str], list[str]]:
    rows = await connection.fetch(
        '''
        DELETE FROM "DivinationRecord"
        WHERE "userId" = $1 AND id = ANY($2::text[])
        RETURNING id
        ''',
        user_id,
        record_ids,
    )
    deleted_set = {str(row["id"]) for row in rows}
    deleted_ids = [record_id for record_id in record_ids if record_id in deleted_set]
    missing_ids = [record_id for record_id in record_ids if record_id not in deleted_set]
    return deleted_ids, missing_ids


def normalize_payload(value: object) -> dict[str, object]:
    if isinstance(value, str):
        parsed = json.loads(value)
        return parsed if isinstance(parsed, dict) else {}

    return value if isinstance(value, dict) else {}
