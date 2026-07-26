import json
from uuid import uuid4

import asyncpg

from app.schemas.bazi import BaziChartDetail, BaziChartInput, BaziChartSummary, BaziCloudChart
from app.services.record_identity import RecordLifecycleConflictError


async def ensure_bazi_tables(connection: asyncpg.Connection) -> None:
    await connection.execute(
        '''
        CREATE TABLE IF NOT EXISTS "BaziProfile" (
          id TEXT PRIMARY KEY,
          "userId" TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
          name TEXT,
          gender TEXT NOT NULL,
          "birthTime" TEXT NOT NULL,
          calendar TEXT NOT NULL,
          location TEXT,
          longitude DOUBLE PRECISION,
          latitude DOUBLE PRECISION,
          "useSolarTime" BOOLEAN NOT NULL DEFAULT FALSE,
          "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
        '''
    )
    await connection.execute(
        '''
        CREATE TABLE IF NOT EXISTS "BaziChart" (
          id TEXT PRIMARY KEY,
          "profileId" TEXT NOT NULL REFERENCES "BaziProfile"(id) ON DELETE CASCADE,
          "chartJson" JSONB NOT NULL,
          "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
        '''
    )
    await connection.execute('CREATE INDEX IF NOT EXISTS "BaziProfile_userId_updatedAt_idx" ON "BaziProfile"("userId", "updatedAt" DESC)')
    await connection.execute('CREATE INDEX IF NOT EXISTS "BaziChart_profileId_createdAt_idx" ON "BaziChart"("profileId", "createdAt" DESC)')


async def create_bazi_chart(connection: asyncpg.Connection, user_id: str, body: BaziChartInput) -> BaziChartDetail:
    await ensure_bazi_tables(connection)
    profile_id = str(uuid4())
    chart_id = str(uuid4())
    chart_json = json.dumps(body.chartJson, ensure_ascii=False)

    async with connection.transaction():
        await connection.execute(
            '''
            INSERT INTO "BaziProfile" (
              id, "userId", name, gender, "birthTime", calendar, location, longitude, latitude, "useSolarTime", "createdAt", "updatedAt"
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
            ''',
            profile_id,
            user_id,
            body.name.strip() or None,
            body.gender,
            body.birthTime,
            body.calendar,
            body.location,
            body.longitude,
            body.latitude,
            body.useSolarTime,
        )
        row = await connection.fetchrow(
            '''
            INSERT INTO "BaziChart" (id, "profileId", "chartJson", "createdAt", "updatedAt")
            VALUES ($1, $2, $3::jsonb, NOW(), NOW())
            RETURNING id, "profileId", "chartJson", "createdAt", "updatedAt"
            ''',
            chart_id,
            profile_id,
            chart_json,
        )

    if not row:
        raise RuntimeError("保存八字排盘失败")

    return chart_detail_from_parts(row, body, profile_id)


async def create_or_update_local_bazi_chart(
    connection: asyncpg.Connection,
    user_id: str,
    local_id: str,
    body: BaziChartInput,
    *,
    record_key: str,
    identity_version: int,
    calculation_version: int,
    lifecycle_version: int,
    submission_mode: str,
) -> tuple[BaziChartDetail, bool]:
    await ensure_bazi_tables(connection)
    existing = await connection.fetchrow(
        '''
        SELECT c.id, c."profileId", c."chartJson", c."createdAt", c."updatedAt",
               p.name, p.gender, p."birthTime", p.calendar, p.location,
               p.longitude, p.latitude, p."useSolarTime", p."recordKey",
               p."identityVersion", p."calculationVersion", p."lifecycleVersion",
               p."deletedAt"
        FROM "BaziChart" c
        INNER JOIN "BaziProfile" p ON p.id = c."profileId"
        WHERE p."userId" = $1
          AND p."deletedAt" IS NULL
          AND (p."recordKey" = $2 OR (p."recordKey" IS NULL AND p."localId" = $3))
        ORDER BY CASE WHEN p."recordKey" = $2 THEN 0 ELSE 1 END
        LIMIT 1
        ''',
        user_id,
        record_key,
        local_id,
    )

    if existing:
        current_lifecycle = int(existing["lifecycleVersion"] or 1)
        if lifecycle_version != current_lifecycle:
            raise RecordLifecycleConflictError("盘局生命周期已更新，请刷新记录后再操作")

        current_calculation = int(existing["calculationVersion"] or 1)
        if calculation_version < current_calculation:
            return chart_detail_from_row(existing), False

        chart_json = json.dumps(body.chartJson, ensure_ascii=False)
        async with connection.transaction():
            await connection.execute(
                '''
                UPDATE "BaziProfile"
                SET "localId" = $3, name = $4, gender = $5, "birthTime" = $6,
                    calendar = $7, location = $8, longitude = $9, latitude = $10,
                    "useSolarTime" = $11, "recordKey" = $12,
                    "identityVersion" = $13, "calculationVersion" = $14,
                    "updatedAt" = NOW()
                WHERE id = $1 AND "userId" = $2
                ''',
                existing["profileId"],
                user_id,
                local_id,
                body.name.strip() or None,
                body.gender,
                body.birthTime,
                body.calendar,
                body.location,
                body.longitude,
                body.latitude,
                body.useSolarTime,
                record_key,
                identity_version,
                calculation_version,
            )
            row = await connection.fetchrow(
                '''
                UPDATE "BaziChart"
                SET "chartJson" = $2::jsonb, "updatedAt" = NOW()
                WHERE id = $1
                RETURNING id, "profileId", "chartJson", "createdAt", "updatedAt"
                ''',
                existing["id"],
                chart_json,
            )

        if not row:
            raise RuntimeError("更新八字排盘失败")
        return chart_detail_from_parts(
            row,
            body,
            str(existing["profileId"]),
            record_key=record_key,
            identity_version=identity_version,
            calculation_version=calculation_version,
            lifecycle_version=current_lifecycle,
        ), False

    tombstone = await connection.fetchrow(
        '''
        SELECT p.id AS "profileId", c.id AS "chartId", p."lifecycleVersion"
        FROM "BaziProfile" p
        INNER JOIN "BaziChart" c ON c."profileId" = p.id
        WHERE p."userId" = $1
          AND p."deletedAt" IS NOT NULL
          AND (p."recordKey" = $2 OR (p."recordKey" IS NULL AND p."localId" = $3))
        ORDER BY p."lifecycleVersion" DESC
        LIMIT 1
        ''',
        user_id,
        record_key,
        local_id,
    )
    next_lifecycle = lifecycle_version
    if tombstone:
        if submission_mode != "explicit":
            raise RecordLifecycleConflictError("该盘局已删除，后台同步不能自动恢复")
        next_lifecycle = max(next_lifecycle, int(tombstone["lifecycleVersion"] or 1) + 1)
        chart_json = json.dumps(body.chartJson, ensure_ascii=False)
        async with connection.transaction():
            await connection.execute(
                '''
                UPDATE "BaziProfile"
                SET "localId" = $3, name = $4, gender = $5, "birthTime" = $6,
                    calendar = $7, location = $8, longitude = $9, latitude = $10,
                    "useSolarTime" = $11, "recordKey" = $12,
                    "identityVersion" = $13, "calculationVersion" = $14,
                    "lifecycleVersion" = $15, "deletedAt" = NULL,
                    "createdAt" = NOW(), "updatedAt" = NOW()
                WHERE id = $1 AND "userId" = $2 AND "deletedAt" IS NOT NULL
                ''',
                tombstone["profileId"],
                user_id,
                local_id,
                body.name.strip() or None,
                body.gender,
                body.birthTime,
                body.calendar,
                body.location,
                body.longitude,
                body.latitude,
                body.useSolarTime,
                record_key,
                identity_version,
                calculation_version,
                next_lifecycle,
            )
            row = await connection.fetchrow(
                '''
                UPDATE "BaziChart"
                SET "chartJson" = $2::jsonb, "createdAt" = NOW(), "updatedAt" = NOW()
                WHERE id = $1
                RETURNING id, "profileId", "chartJson", "createdAt", "updatedAt"
                ''',
                tombstone["chartId"],
                chart_json,
            )
        if not row:
            raise RuntimeError("重新创建八字排盘失败")
        return chart_detail_from_parts(
            row,
            body,
            str(tombstone["profileId"]),
            record_key=record_key,
            identity_version=identity_version,
            calculation_version=calculation_version,
            lifecycle_version=next_lifecycle,
        ), True

    profile_id = str(uuid4())
    chart_id = str(uuid4())
    chart_json = json.dumps(body.chartJson, ensure_ascii=False)
    try:
        async with connection.transaction():
            await connection.execute(
                '''
                INSERT INTO "BaziProfile" (
                  id, "userId", "localId", "recordKey", "identityVersion",
                  "calculationVersion", "lifecycleVersion", name, gender,
                  "birthTime", calendar, location, longitude, latitude,
                  "useSolarTime", "createdAt", "updatedAt"
                )
                VALUES (
                  $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
                  $11, $12, $13, $14, $15, NOW(), NOW()
                )
                ''',
                profile_id,
                user_id,
                local_id,
                record_key,
                identity_version,
                calculation_version,
                next_lifecycle,
                body.name.strip() or None,
                body.gender,
                body.birthTime,
                body.calendar,
                body.location,
                body.longitude,
                body.latitude,
                body.useSolarTime,
            )
            row = await connection.fetchrow(
                '''
                INSERT INTO "BaziChart" (id, "profileId", "chartJson", "createdAt", "updatedAt")
                VALUES ($1, $2, $3::jsonb, NOW(), NOW())
                RETURNING id, "profileId", "chartJson", "createdAt", "updatedAt"
                ''',
                chart_id,
                profile_id,
                chart_json,
            )
    except asyncpg.UniqueViolationError:
        return await create_or_update_local_bazi_chart(
            connection,
            user_id,
            local_id,
            body,
            record_key=record_key,
            identity_version=identity_version,
            calculation_version=calculation_version,
            lifecycle_version=lifecycle_version,
            submission_mode=submission_mode,
        )

    if not row:
        raise RuntimeError("保存八字排盘失败")
    return chart_detail_from_parts(
        row,
        body,
        profile_id,
        record_key=record_key,
        identity_version=identity_version,
        calculation_version=calculation_version,
        lifecycle_version=next_lifecycle,
    ), True


async def list_bazi_charts(connection: asyncpg.Connection, user_id: str) -> list[BaziCloudChart]:
    await ensure_bazi_tables(connection)
    rows = await connection.fetch(
        '''
        SELECT c.id, c."profileId", c."chartJson", c."createdAt", c."updatedAt",
               p."localId", p.name, p.gender, p."birthTime", p.calendar, p.location,
               p.longitude, p.latitude, p."useSolarTime", p."recordKey",
               p."identityVersion", p."calculationVersion", p."lifecycleVersion",
               p."deletedAt"
        FROM "BaziChart" c
        INNER JOIN "BaziProfile" p ON p.id = c."profileId"
        WHERE p."userId" = $1 AND p."deletedAt" IS NULL
        ORDER BY c."updatedAt" DESC
        LIMIT 1000
        ''',
        user_id,
    )
    return [
        BaziCloudChart(
            **chart_summary_from_row(row).model_dump(),
            localId=row["localId"],
        )
        for row in rows
    ]


async def get_bazi_chart(connection: asyncpg.Connection, user_id: str, chart_id: str) -> BaziChartDetail | None:
    await ensure_bazi_tables(connection)
    row = await connection.fetchrow(
        '''
        SELECT c.id, c."profileId", c."chartJson", c."createdAt", c."updatedAt",
               p.name, p.gender, p."birthTime", p.calendar, p.location, p.longitude, p.latitude, p."useSolarTime"
               , p."recordKey", p."identityVersion", p."calculationVersion",
               p."lifecycleVersion", p."deletedAt"
        FROM "BaziChart" c
        INNER JOIN "BaziProfile" p ON p.id = c."profileId"
        WHERE c.id = $1 AND p."userId" = $2 AND p."deletedAt" IS NULL
        LIMIT 1
        ''',
        chart_id,
        user_id,
    )

    return chart_detail_from_row(row) if row else None


async def delete_bazi_chart(connection: asyncpg.Connection, user_id: str, chart_id: str) -> bool:
    await ensure_bazi_tables(connection)
    row = await connection.fetchrow(
        '''
        UPDATE "BaziProfile" p
        SET "deletedAt" = NOW(),
            "updatedAt" = NOW(),
            "lifecycleVersion" = "lifecycleVersion" + 1
        FROM "BaziChart" c
        WHERE c.id = $1
          AND c."profileId" = p.id
          AND p."userId" = $2
          AND p."deletedAt" IS NULL
        RETURNING p.id
        ''',
        chart_id,
        user_id,
    )
    return bool(row)


async def delete_bazi_charts(
    connection: asyncpg.Connection,
    user_id: str,
    chart_ids: list[str],
) -> tuple[list[str], list[str]]:
    await ensure_bazi_tables(connection)
    rows = await connection.fetch(
        '''
        SELECT c.id
        FROM "BaziChart" c
        INNER JOIN "BaziProfile" p ON p.id = c."profileId"
        WHERE p."userId" = $1
          AND p."deletedAt" IS NULL
          AND c.id = ANY($2::text[])
        ''',
        user_id,
        chart_ids,
    )
    found_ids = {str(row["id"]) for row in rows}
    deleted_ids = [chart_id for chart_id in chart_ids if chart_id in found_ids]
    missing_ids = [chart_id for chart_id in chart_ids if chart_id not in found_ids]

    if not deleted_ids:
        return deleted_ids, missing_ids

    await connection.execute(
        '''
        UPDATE "BaziProfile" p
        SET "deletedAt" = NOW(),
            "updatedAt" = NOW(),
            "lifecycleVersion" = "lifecycleVersion" + 1
        FROM "BaziChart" c
        WHERE c.id = ANY($1::text[])
          AND c."profileId" = p.id
          AND p."userId" = $2
          AND p."deletedAt" IS NULL
        ''',
        deleted_ids,
        user_id,
    )

    return deleted_ids, missing_ids


def chart_detail_from_parts(
    row: asyncpg.Record,
    body: BaziChartInput,
    profile_id: str,
    *,
    record_key: str | None = None,
    identity_version: int | None = None,
    calculation_version: int | None = None,
    lifecycle_version: int = 1,
) -> BaziChartDetail:
    return BaziChartDetail(
        id=row["id"],
        profileId=profile_id,
        name=body.name.strip() or "未命名",
        gender=body.gender,
        birthTime=body.birthTime,
        calendar=body.calendar,
        location=body.location,
        longitude=body.longitude,
        latitude=body.latitude,
        useSolarTime=body.useSolarTime,
        pillars=extract_pillars(body.chartJson),
        chartJson=body.chartJson,
        createdAt=row["createdAt"].isoformat(),
        updatedAt=row["updatedAt"].isoformat(),
        recordKey=record_key,
        identityVersion=identity_version,
        calculationVersion=calculation_version,
        lifecycleVersion=lifecycle_version,
    )


def chart_summary_from_row(row: asyncpg.Record) -> BaziChartSummary:
    chart_json = normalize_chart_json(row["chartJson"])

    return BaziChartSummary(
        id=row["id"],
        profileId=row["profileId"],
        name=row["name"] or "未命名",
        gender=row["gender"],
        birthTime=row["birthTime"],
        calendar=row["calendar"],
        location=row["location"],
        longitude=row["longitude"],
        latitude=row["latitude"],
        useSolarTime=row["useSolarTime"],
        pillars=extract_pillars(chart_json),
        createdAt=row["createdAt"].isoformat(),
        updatedAt=row["updatedAt"].isoformat(),
        recordKey=row["recordKey"],
        identityVersion=row["identityVersion"],
        calculationVersion=row["calculationVersion"],
        lifecycleVersion=int(row["lifecycleVersion"] or 1),
        deletedAt=row["deletedAt"].isoformat() if row["deletedAt"] else None,
    )


def chart_detail_from_row(row: asyncpg.Record) -> BaziChartDetail:
    chart_json = normalize_chart_json(row["chartJson"])
    summary = chart_summary_from_row(row)

    return BaziChartDetail(**summary.model_dump(), chartJson=chart_json)


def normalize_chart_json(value: object) -> dict[str, object]:
    if isinstance(value, str):
        parsed = json.loads(value)
        return parsed if isinstance(parsed, dict) else {}

    return value if isinstance(value, dict) else {}


def extract_pillars(chart_json: dict[str, object]) -> str:
    columns = chart_json.get("columns")
    if not isinstance(columns, list):
        return ""

    pillars: list[str] = []
    for column in columns:
        if not isinstance(column, dict):
            continue
        pillar = column.get("pillar")
        if not isinstance(pillar, dict):
            continue
        stem = pillar.get("stem")
        branch = pillar.get("branch")
        if isinstance(stem, str) and isinstance(branch, str):
            pillars.append(f"{stem}{branch}")

    return " ".join(pillars)
