from uuid import uuid4

import asyncpg

from app.schemas.profiles import ProfileIn, ProfileOut


async def ensure_divination_profile_table(connection: asyncpg.Connection) -> None:
    await connection.execute(
        '''
        CREATE TABLE IF NOT EXISTS "DivinationProfile" (
          id TEXT PRIMARY KEY,
          "userId" TEXT NOT NULL,
          source TEXT NOT NULL,
          name TEXT,
          gender TEXT NOT NULL,
          "birthTime" TEXT NOT NULL,
          location TEXT,
          "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
        '''
    )
    await connection.execute('CREATE INDEX IF NOT EXISTS "DivinationProfile_userId_updatedAt_idx" ON "DivinationProfile"("userId", "updatedAt" DESC)')
    await connection.execute('CREATE UNIQUE INDEX IF NOT EXISTS "DivinationProfile_identity_key" ON "DivinationProfile"("userId", name, gender, "birthTime")')


async def list_profiles(connection: asyncpg.Connection, user_id: str) -> list[ProfileOut]:
    await ensure_divination_profile_table(connection)
    rows = await connection.fetch(
        '''
        SELECT id, source, name, gender, "birthTime", location
        FROM "DivinationProfile"
        WHERE "userId" = $1
        ORDER BY "updatedAt" DESC
        LIMIT 20
        ''',
        user_id,
    )
    return [profile_from_row(row) for row in rows]


async def upsert_profile(connection: asyncpg.Connection, user_id: str, body: ProfileIn) -> ProfileOut | None:
    await ensure_divination_profile_table(connection)
    row = await connection.fetchrow(
        '''
        INSERT INTO "DivinationProfile" (id, "userId", source, name, gender, "birthTime", location, "createdAt", "updatedAt")
        VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
        ON CONFLICT ("userId", name, gender, "birthTime")
        DO UPDATE SET
          source = EXCLUDED.source,
          location = COALESCE(EXCLUDED.location, "DivinationProfile".location),
          "updatedAt" = NOW()
        RETURNING id, source, name, gender, "birthTime", location
        ''',
        str(uuid4()),
        user_id,
        body.source,
        body.name,
        body.gender,
        body.dateTime,
        body.location,
    )
    return profile_from_row(row) if row else None


def profile_from_row(row: asyncpg.Record) -> ProfileOut:
    return ProfileOut(
        id=row["id"],
        source=row["source"],
        name=row["name"] or "",
        gender=row["gender"],
        dateTime=row["birthTime"],
        location=row["location"],
    )
