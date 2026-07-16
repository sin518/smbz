import json
from datetime import datetime
from uuid import uuid4

import asyncpg

from app.schemas.divination_records import DivinationRecordSyncRequest, DivinationRecordType


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
