import json
from uuid import uuid4

import asyncpg

from app.redis import optional_redis
from app.schemas.profiles import ProfileIn, ProfileOut

PROFILE_CACHE_SECONDS = 60 * 10
PROFILE_CACHE_PREFIX = "profiles:"


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
    cached = await get_cached_profiles(user_id)
    if cached is not None:
        return cached

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
    profiles = [profile_from_row(row) for row in rows]
    await set_cached_profiles(user_id, profiles)
    return profiles


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
    await delete_cached_profiles(user_id)
    return profile_from_row(row) if row else None


async def delete_profile(connection: asyncpg.Connection, user_id: str, profile_id: str) -> bool:
    await ensure_divination_profile_table(connection)
    result = await connection.execute(
        '''
        DELETE FROM "DivinationProfile"
        WHERE id = $1 AND "userId" = $2
        ''',
        profile_id,
        user_id,
    )
    deleted = result == "DELETE 1"
    if deleted:
        await delete_cached_profiles(user_id)
    return deleted


def profile_from_row(row: asyncpg.Record) -> ProfileOut:
    return ProfileOut(
        id=row["id"],
        source=row["source"],
        name=row["name"] or "",
        gender=row["gender"],
        dateTime=row["birthTime"],
        location=row["location"],
    )


async def get_cached_profiles(user_id: str) -> list[ProfileOut] | None:
    async with optional_redis() as redis:
        if redis is None:
            return None

        try:
            raw = await redis.get(profile_cache_key(user_id))
        except Exception as error:
            print(f"[redis] read profiles failed: {type(error).__name__}: {error}")
            return None

    if not raw:
        return None

    try:
        parsed = json.loads(raw)
    except json.JSONDecodeError:
        return None

    if not isinstance(parsed, list):
        return None

    profiles: list[ProfileOut] = []
    for item in parsed:
        if isinstance(item, dict):
            try:
                profiles.append(ProfileOut(**item))
            except Exception:
                continue

    return profiles


async def set_cached_profiles(user_id: str, profiles: list[ProfileOut]) -> None:
    async with optional_redis() as redis:
        if redis is None:
            return

        try:
            await redis.setex(
                profile_cache_key(user_id),
                PROFILE_CACHE_SECONDS,
                json.dumps([profile.model_dump() for profile in profiles], ensure_ascii=False),
            )
        except Exception as error:
            print(f"[redis] write profiles failed: {type(error).__name__}: {error}")


async def delete_cached_profiles(user_id: str) -> None:
    async with optional_redis() as redis:
        if redis is None:
            return

        try:
            await redis.delete(profile_cache_key(user_id))
        except Exception as error:
            print(f"[redis] delete profiles failed: {type(error).__name__}: {error}")


def profile_cache_key(user_id: str) -> str:
    return f"{PROFILE_CACHE_PREFIX}{user_id}"
