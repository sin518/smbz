import json
from dataclasses import dataclass
from datetime import datetime
from uuid import uuid4

import asyncpg

from app.schemas.divination_records import DivinationRecordCloudItem, DivinationRecordSyncRequest, DivinationRecordType
from app.services.record_identity import RecordLifecycleConflictError


@dataclass(frozen=True)
class DivinationSyncOutcome:
    server_id: str
    synced_at: datetime
    created: bool
    record_key: str
    identity_version: int
    calculation_version: int
    lifecycle_version: int


async def upsert_divination_record(
    connection: asyncpg.Connection,
    user_id: str,
    record_type: DivinationRecordType,
    body: DivinationRecordSyncRequest,
    *,
    record_key: str,
    identity_version: int,
) -> DivinationSyncOutcome:
    calculation_version = body.calculationVersion or 1
    existing = await connection.fetchrow(
        '''
        SELECT id, "updatedAt", "calculationVersion", "lifecycleVersion"
        FROM "DivinationRecord"
        WHERE "userId" = $1
          AND type = $2
          AND "deletedAt" IS NULL
          AND ("recordKey" = $3 OR ("recordKey" IS NULL AND "localId" = $4))
        ORDER BY CASE WHEN "recordKey" = $3 THEN 0 ELSE 1 END
        LIMIT 1
        ''',
        user_id,
        record_type,
        record_key,
        body.localId,
    )

    if existing:
        current_lifecycle = int(existing["lifecycleVersion"] or 1)
        if body.lifecycleVersion != current_lifecycle:
            raise RecordLifecycleConflictError("盘局生命周期已更新，请刷新记录后再操作")

        current_calculation = int(existing["calculationVersion"] or 1)
        if calculation_version < current_calculation:
            return _outcome_from_row(
                existing,
                created=False,
                record_key=record_key,
                identity_version=identity_version,
                calculation_version=current_calculation,
                lifecycle_version=current_lifecycle,
            )

        row = await connection.fetchrow(
            '''
            UPDATE "DivinationRecord"
            SET "localId" = $4,
                question = $5,
                summary = $6,
                detail = $7,
                payload = $8::jsonb,
                "recordKey" = $9,
                "identityVersion" = $10,
                "calculationVersion" = $11,
                "updatedAt" = NOW()
            WHERE id = $1 AND "userId" = $2 AND type = $3 AND "deletedAt" IS NULL
            RETURNING id, "updatedAt", "calculationVersion", "lifecycleVersion"
            ''',
            existing["id"],
            user_id,
            record_type,
            body.localId,
            body.question.strip(),
            body.summary.strip(),
            body.detail.strip(),
            json.dumps(body.payload, ensure_ascii=False),
            record_key,
            identity_version,
            calculation_version,
        )
        if not row:
            raise RuntimeError("更新占术记录失败")
        return _outcome_from_row(
            row,
            created=False,
            record_key=record_key,
            identity_version=identity_version,
            calculation_version=calculation_version,
            lifecycle_version=current_lifecycle,
        )

    tombstone = await connection.fetchrow(
        '''
        SELECT id, "lifecycleVersion"
        FROM "DivinationRecord"
        WHERE "userId" = $1
          AND type = $2
          AND "deletedAt" IS NOT NULL
          AND ("recordKey" = $3 OR ("recordKey" IS NULL AND "localId" = $4))
        ORDER BY "lifecycleVersion" DESC
        LIMIT 1
        ''',
        user_id,
        record_type,
        record_key,
        body.localId,
    )
    lifecycle_version = body.lifecycleVersion
    if tombstone:
        if body.submissionMode != "explicit":
            raise RecordLifecycleConflictError("该盘局已删除，后台同步不能自动恢复")
        lifecycle_version = max(lifecycle_version, int(tombstone["lifecycleVersion"] or 1) + 1)
        row = await connection.fetchrow(
            '''
            UPDATE "DivinationRecord"
            SET "localId" = $4,
                question = $5,
                summary = $6,
                detail = $7,
                payload = $8::jsonb,
                "occurredAt" = $9,
                "recordKey" = $10,
                "identityVersion" = $11,
                "calculationVersion" = $12,
                "lifecycleVersion" = $13,
                "deletedAt" = NULL,
                "createdAt" = NOW(),
                "updatedAt" = NOW()
            WHERE id = $1 AND "userId" = $2 AND type = $3 AND "deletedAt" IS NOT NULL
            RETURNING id, "updatedAt", "calculationVersion", "lifecycleVersion"
            ''',
            tombstone["id"],
            user_id,
            record_type,
            body.localId,
            body.question.strip(),
            body.summary.strip(),
            body.detail.strip(),
            json.dumps(body.payload, ensure_ascii=False),
            body.createdAt,
            record_key,
            identity_version,
            calculation_version,
            lifecycle_version,
        )
        if not row:
            raise RuntimeError("重新创建占术记录失败")
        return _outcome_from_row(
            row,
            created=True,
            record_key=record_key,
            identity_version=identity_version,
            calculation_version=calculation_version,
            lifecycle_version=lifecycle_version,
        )

    record_id = str(uuid4())
    try:
        row = await connection.fetchrow(
            '''
            INSERT INTO "DivinationRecord" (
              id, "userId", type, "localId", "recordKey", "identityVersion",
              "calculationVersion", "lifecycleVersion", question, summary, detail,
              payload, "occurredAt", "createdAt", "updatedAt"
            )
            VALUES (
              $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11,
              $12::jsonb, $13, NOW(), NOW()
            )
            RETURNING id, "updatedAt", "calculationVersion", "lifecycleVersion"
            ''',
            record_id,
            user_id,
            record_type,
            body.localId,
            record_key,
            identity_version,
            calculation_version,
            lifecycle_version,
            body.question.strip(),
            body.summary.strip(),
            body.detail.strip(),
            json.dumps(body.payload, ensure_ascii=False),
            body.createdAt,
        )
    except asyncpg.UniqueViolationError:
        return await upsert_divination_record(
            connection,
            user_id,
            record_type,
            body,
            record_key=record_key,
            identity_version=identity_version,
        )

    if not row:
        raise RuntimeError("保存占术记录失败")
    return _outcome_from_row(
        row,
        created=True,
        record_key=record_key,
        identity_version=identity_version,
        calculation_version=calculation_version,
        lifecycle_version=lifecycle_version,
    )


async def list_divination_records(connection: asyncpg.Connection, user_id: str) -> list[DivinationRecordCloudItem]:
    rows = await connection.fetch(
        '''
        SELECT id, "localId", type, question, summary, detail,
               "occurredAt", "updatedAt", "recordKey", "identityVersion",
               "calculationVersion", "lifecycleVersion", "deletedAt"
        FROM "DivinationRecord"
        WHERE "userId" = $1 AND "deletedAt" IS NULL
        ORDER BY "updatedAt" DESC
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
            payload={},
            createdAt=row["occurredAt"].isoformat(),
            updatedAt=row["updatedAt"].isoformat(),
            recordKey=row["recordKey"],
            identityVersion=row["identityVersion"],
            calculationVersion=row["calculationVersion"],
            lifecycleVersion=int(row["lifecycleVersion"] or 1),
            deletedAt=row["deletedAt"].isoformat() if row["deletedAt"] else None,
        )
        for row in rows
    ]


async def get_divination_record(
    connection: asyncpg.Connection,
    user_id: str,
    record_id: str,
) -> DivinationRecordCloudItem | None:
    row = await connection.fetchrow(
        '''
        SELECT id, "localId", type, question, summary, detail, payload,
               "occurredAt", "updatedAt", "recordKey", "identityVersion",
               "calculationVersion", "lifecycleVersion", "deletedAt"
        FROM "DivinationRecord"
        WHERE id = $1 AND "userId" = $2 AND "deletedAt" IS NULL
        LIMIT 1
        ''',
        record_id,
        user_id,
    )
    if not row:
        return None
    return DivinationRecordCloudItem(
        id=str(row["id"]),
        localId=str(row["localId"]),
        type=row["type"],
        question=row["question"],
        summary=row["summary"],
        detail=row["detail"],
        payload=normalize_payload(row["payload"]),
        createdAt=row["occurredAt"].isoformat(),
        updatedAt=row["updatedAt"].isoformat(),
        recordKey=row["recordKey"],
        identityVersion=row["identityVersion"],
        calculationVersion=row["calculationVersion"],
        lifecycleVersion=int(row["lifecycleVersion"] or 1),
        deletedAt=None,
    )


async def delete_divination_record(connection: asyncpg.Connection, user_id: str, record_id: str) -> bool:
    row = await connection.fetchrow(
        '''
        UPDATE "DivinationRecord"
        SET "deletedAt" = NOW(),
            "updatedAt" = NOW(),
            "lifecycleVersion" = "lifecycleVersion" + 1
        WHERE id = $1 AND "userId" = $2 AND "deletedAt" IS NULL
        RETURNING id
        ''',
        record_id,
        user_id,
    )
    return bool(row)


async def delete_divination_records(
    connection: asyncpg.Connection,
    user_id: str,
    record_ids: list[str],
) -> tuple[list[str], list[str]]:
    rows = await connection.fetch(
        '''
        UPDATE "DivinationRecord"
        SET "deletedAt" = NOW(),
            "updatedAt" = NOW(),
            "lifecycleVersion" = "lifecycleVersion" + 1
        WHERE "userId" = $1
          AND id = ANY($2::text[])
          AND "deletedAt" IS NULL
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


def _outcome_from_row(
    row: asyncpg.Record,
    *,
    created: bool,
    record_key: str,
    identity_version: int,
    calculation_version: int,
    lifecycle_version: int,
) -> DivinationSyncOutcome:
    return DivinationSyncOutcome(
        server_id=str(row["id"]),
        synced_at=row["updatedAt"],
        created=created,
        record_key=record_key,
        identity_version=identity_version,
        calculation_version=calculation_version,
        lifecycle_version=lifecycle_version,
    )
