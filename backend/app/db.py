from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

import asyncpg
from fastapi import HTTPException

from app.core.config import get_settings


_pool: asyncpg.Pool | None = None


async def connect_db() -> None:
    global _pool
    settings = get_settings()
    if not settings.database_url:
        return
    try:
        _pool = await asyncpg.create_pool(settings.database_url, min_size=1, max_size=5)
    except OSError as error:
        print(f"[database] startup connection failed: {error}")
        _pool = None


async def close_db() -> None:
    global _pool
    if _pool is not None:
        await _pool.close()
        _pool = None


async def get_connection() -> AsyncIterator[asyncpg.Connection]:
    if _pool is None:
        await connect_db()

    if _pool is None:
        raise HTTPException(status_code=503, detail="数据库暂时不可用，请检查 DATABASE_URL 或网络连接")

    async with _pool.acquire() as connection:
        yield connection


@asynccontextmanager
async def acquire_connection() -> AsyncIterator[asyncpg.Connection]:
    if _pool is None:
        await connect_db()

    if _pool is None:
        raise HTTPException(status_code=503, detail="数据库暂时不可用，请检查 DATABASE_URL 或网络连接")

    async with _pool.acquire() as connection:
        yield connection
