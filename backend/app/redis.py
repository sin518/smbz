"""
Redis client setup - supports both Upstash REST API and traditional Redis
"""

import os
from contextlib import asynccontextmanager
from typing import Any

try:
    from upstash_redis import Redis as UpstashRedis
    UPSTASH_AVAILABLE = True
except ImportError:
    UPSTASH_AVAILABLE = False
    UpstashRedis = None

import redis.asyncio as redis

from app.core.config import get_settings


_redis_client: Any = None
_redis_initialized: bool = False


def _init_redis_sync() -> None:
    """同步初始化 Redis 客户端 (仅限 Upstash)"""
    global _redis_client, _redis_initialized

    if _redis_initialized:
        return

    _redis_initialized = True

    # 优先使用 Upstash REST API (适合 Serverless)
    upstash_url = os.getenv("UPSTASH_REDIS_REST_URL")
    upstash_token = os.getenv("UPSTASH_REDIS_REST_TOKEN")

    if upstash_url and upstash_token and UPSTASH_AVAILABLE:
        print("[redis] Using Upstash REST API")
        _redis_client = UpstashRedisAdapter(
            UpstashRedis(url=upstash_url, token=upstash_token)
        )
        print("[redis] Upstash connected")
        return

    print("[redis] UPSTASH_REDIS_REST_URL/TOKEN not configured")


async def connect_redis() -> None:
    """异步初始化 Redis (仅用于传统 Redis)"""
    global _redis_client, _redis_initialized

    if _redis_initialized:
        return

    _redis_initialized = True
    settings = get_settings()

    # 优先尝试 Upstash
    _init_redis_sync()
    if _redis_client:
        return

    # 降级到传统 Redis 协议
    if not settings.redis_url:
        print("[redis] REDIS_URL not configured, running without cache")
        return

    try:
        _redis_client = redis.from_url(settings.redis_url, decode_responses=True)
        await _redis_client.ping()
        print("[redis] Traditional Redis connected")
    except Exception as error:
        print(f"[redis] startup connection failed: {error}")
        _redis_client = None


async def close_redis() -> None:
    global _redis_client
    if _redis_client and hasattr(_redis_client, 'aclose'):
        try:
            await _redis_client.aclose()
        except Exception as e:
            print(f"[redis] Error closing connection: {e}")
    _redis_client = None


def get_redis_client() -> Any:
    """获取 Redis 客户端 (懒加载)"""
    if not _redis_initialized:
        _init_redis_sync()
    return _redis_client


@asynccontextmanager
async def optional_redis():
    yield _redis_client


class UpstashRedisAdapter:
    """Upstash Redis 适配器 - 将同步接口适配为异步"""

    def __init__(self, client):
        self.client = client

    async def hset(self, key: str, field: str = None, value: str = None, mapping: dict = None):
        if mapping:
            return self.client.hset(key, mapping)
        return self.client.hset(key, {field: value})

    async def hget(self, key: str, field: str):
        return self.client.hget(key, field)

    async def hgetall(self, key: str):
        result = self.client.hgetall(key)
        return result if result else {}

    async def zadd(self, key: str, mapping: dict):
        return self.client.zadd(key, mapping)

    async def zrangebyscore(self, key: str, min_score: float, max_score: float, start: int = 0, num: int = -1):
        result = self.client.zrangebyscore(key, min_score, max_score)
        return result if result else []

    async def zrem(self, key: str, *members):
        return self.client.zrem(key, *members)

    async def sadd(self, key: str, *members):
        return self.client.sadd(key, *members)

    async def smembers(self, key: str):
        result = self.client.smembers(key)
        return list(result) if result else []

    async def srem(self, key: str, *members):
        return self.client.srem(key, *members)

    async def delete(self, *keys):
        return self.client.delete(*keys)

    async def expire(self, key: str, seconds: int):
        return self.client.expire(key, seconds)

    async def exists(self, key: str):
        result = self.client.exists(key)
        return 1 if result else 0

    async def get(self, key: str):
        return self.client.get(key)

    async def setex(self, key: str, seconds: int, value: str):
        return self.client.setex(key, seconds, value)

    async def ping(self):
        """Health check"""
        return True

    def pipeline(self, transaction: bool = False):
        return UpstashPipelineAdapter(self.client, self)


class UpstashPipelineAdapter:
    """模拟 Pipeline 接口"""

    def __init__(self, client, adapter):
        self.client = client
        self.adapter = adapter
        self.commands = []

    def hset(self, key: str, field: str = None, value: str = None, mapping: dict = None):
        self.commands.append(("hset", key, field, value, mapping))
        return self

    def zadd(self, key: str, mapping: dict):
        self.commands.append(("zadd", key, mapping))
        return self

    def sadd(self, key: str, *members):
        self.commands.append(("sadd", key, members))
        return self

    def expire(self, key: str, seconds: int):
        self.commands.append(("expire", key, seconds))
        return self

    def delete(self, *keys):
        self.commands.append(("delete", keys))
        return self

    def zrem(self, key: str, *members):
        self.commands.append(("zrem", key, members))
        return self

    def srem(self, key: str, *members):
        self.commands.append(("srem", key, members))
        return self

    async def __aenter__(self):
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        pass

    async def execute(self):
        results = []
        for cmd in self.commands:
            cmd_name = cmd[0]
            if cmd_name == "hset":
                _, key, field, value, mapping = cmd
                results.append(await self.adapter.hset(key, field, value, mapping))
            elif cmd_name == "zadd":
                _, key, mapping = cmd
                results.append(await self.adapter.zadd(key, mapping))
            elif cmd_name == "sadd":
                _, key, members = cmd
                results.append(await self.adapter.sadd(key, *members))
            elif cmd_name == "expire":
                _, key, seconds = cmd
                results.append(await self.adapter.expire(key, seconds))
            elif cmd_name == "delete":
                _, keys = cmd
                results.append(await self.adapter.delete(*keys))
            elif cmd_name == "zrem":
                _, key, members = cmd
                results.append(await self.adapter.zrem(key, *members))
            elif cmd_name == "srem":
                _, key, members = cmd
                results.append(await self.adapter.srem(key, *members))
        return results
