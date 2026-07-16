import json
from uuid import uuid4

import asyncpg

from app.schemas.bazi import BaziChartDetail, BaziChartInput, BaziChartSummary


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
) -> tuple[BaziChartDetail, bool]:
    await ensure_bazi_tables(connection)
    existing = await connection.fetchrow(
        '''
        SELECT c.id, c."profileId"
        FROM "BaziChart" c
        INNER JOIN "BaziProfile" p ON p.id = c."profileId"
        WHERE p."userId" = $1 AND p."localId" = $2
        LIMIT 1
        ''',
        user_id,
        local_id,
    )

    if existing:
        chart_json = json.dumps(body.chartJson, ensure_ascii=False)
        async with connection.transaction():
            await connection.execute(
                '''
                UPDATE "BaziProfile"
                SET name = $3, gender = $4, "birthTime" = $5, calendar = $6,
                    location = $7, longitude = $8, latitude = $9,
                    "useSolarTime" = $10, "updatedAt" = NOW()
                WHERE id = $1 AND "userId" = $2
                ''',
                existing["profileId"],
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
        return chart_detail_from_parts(row, body, str(existing["profileId"])), False

    profile_id = str(uuid4())
    chart_id = str(uuid4())
    chart_json = json.dumps(body.chartJson, ensure_ascii=False)
    try:
        async with connection.transaction():
            await connection.execute(
                '''
                INSERT INTO "BaziProfile" (
                  id, "userId", "localId", name, gender, "birthTime", calendar,
                  location, longitude, latitude, "useSolarTime", "createdAt", "updatedAt"
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())
                ''',
                profile_id,
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
        return await create_or_update_local_bazi_chart(connection, user_id, local_id, body)

    if not row:
        raise RuntimeError("保存八字排盘失败")
    return chart_detail_from_parts(row, body, profile_id), True


async def list_bazi_charts(connection: asyncpg.Connection, user_id: str) -> list[BaziChartSummary]:
    await ensure_bazi_tables(connection)
    rows = await connection.fetch(
        '''
        SELECT c.id, c."profileId", c."chartJson", c."createdAt", c."updatedAt",
               p.name, p.gender, p."birthTime", p.calendar, p.location, p.longitude, p.latitude, p."useSolarTime"
        FROM "BaziChart" c
        INNER JOIN "BaziProfile" p ON p.id = c."profileId"
        WHERE p."userId" = $1
        ORDER BY c."createdAt" DESC
        LIMIT 50
        ''',
        user_id,
    )
    return [chart_summary_from_row(row) for row in rows]


async def get_bazi_chart(connection: asyncpg.Connection, user_id: str, chart_id: str) -> BaziChartDetail | None:
    await ensure_bazi_tables(connection)
    row = await connection.fetchrow(
        '''
        SELECT c.id, c."profileId", c."chartJson", c."createdAt", c."updatedAt",
               p.name, p.gender, p."birthTime", p.calendar, p.location, p.longitude, p.latitude, p."useSolarTime"
        FROM "BaziChart" c
        INNER JOIN "BaziProfile" p ON p.id = c."profileId"
        WHERE c.id = $1 AND p."userId" = $2
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
        SELECT c."profileId"
        FROM "BaziChart" c
        INNER JOIN "BaziProfile" p ON p.id = c."profileId"
        WHERE c.id = $1 AND p."userId" = $2
        LIMIT 1
        ''',
        chart_id,
        user_id,
    )

    if not row:
        return False

    profile_id = row["profileId"]

    async with connection.transaction():
        await connection.execute('DELETE FROM "BaziChart" WHERE id = $1', chart_id)
        remaining_count = await connection.fetchval('SELECT COUNT(*) FROM "BaziChart" WHERE "profileId" = $1', profile_id)

        if int(remaining_count or 0) == 0:
            await connection.execute('DELETE FROM "BaziProfile" WHERE id = $1 AND "userId" = $2', profile_id, user_id)

    return True


def chart_detail_from_parts(row: asyncpg.Record, body: BaziChartInput, profile_id: str) -> BaziChartDetail:
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
