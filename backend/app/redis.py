from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
from typing import Any

try:
    from redis.asyncio import Redis
except ModuleNotFoundError:
    Redis = None  # type: ignore[assignment]

from app.core.config import get_settings


_redis: Any | None = None


async def connect_redis() -> None:
    global _redis
    settings = get_settings()
    if not settings.redis_url:
        return
    if Redis is None:
        print("[redis] package is not installed; install backend/requirements.txt to enable Redis")
        return

    try:
        client = Redis.from_url(settings.redis_url, encoding="utf-8", decode_responses=True)
        await client.ping()
        _redis = client
    except Exception as error:
        print(f"[redis] startup connection failed: {type(error).__name__}: {error}")
        _redis = None


async def close_redis() -> None:
    global _redis
    if _redis is not None:
        await _redis.aclose()
        _redis = None


def get_redis_client() -> Any | None:
    return _redis


@asynccontextmanager
async def optional_redis() -> AsyncIterator[Any | None]:
    if _redis is None:
        await connect_redis()
    yield _redis
