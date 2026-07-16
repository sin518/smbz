"""
Upstash Redis 客户端(兼容 Vercel Serverless)

支持两种模式:
1. Upstash REST API (推荐用于 Serverless)
2. 传统 Redis 协议
"""

import json
import os
from typing import Any

try:
    from upstash_redis import Redis as UpstashRedis
    UPSTASH_AVAILABLE = True
except ImportError:
    UPSTASH_AVAILABLE = False

import redis.asyncio as redis


_redis_client: Any = None


def get_redis_client() -> Any:
    """获取 Redis 客户端"""
    global _redis_client
    if _redis_client is not None:
        return _redis_client

    # 优先使用 Upstash REST API (适合 Serverless)
    upstash_url = os.getenv("UPSTASH_REDIS_REST_URL")
    upstash_token = os.getenv("UPSTASH_REDIS_REST_TOKEN")

    if upstash_url and upstash_token and UPSTASH_AVAILABLE:
        print("[Redis] Using Upstash REST API")
        _redis_client = UpstashRedisAdapter(
            UpstashRedis(url=upstash_url, token=upstash_token)
        )
        return _redis_client

    # 降级到传统 Redis 协议
    redis_url = os.getenv("REDIS_URL")
    if redis_url:
        print("[Redis] Using traditional Redis protocol")
        _redis_client = redis.from_url(redis_url, decode_responses=True)
        return _redis_client

    print("[Redis] Not configured")
    return None


class UpstashRedisAdapter:
    """
    Upstash Redis 适配器
    将 Upstash SDK 的同步接口适配为异步接口
    """

    def __init__(self, client: Any):
        self.client = client

    async def hset(self, key: str, field: str = None, value: str = None, mapping: dict = None):
        """Set hash field"""
        if mapping:
            return self.client.hset(key, mapping)
        return self.client.hset(key, {field: value})

    async def hget(self, key: str, field: str) -> str | None:
        """Get hash field"""
        return self.client.hget(key, field)

    async def hgetall(self, key: str) -> dict:
        """Get all hash fields"""
        result = self.client.hgetall(key)
        return result if result else {}

    async def zadd(self, key: str, mapping: dict):
        """Add to sorted set"""
        # Upstash format: {member: score}
        return self.client.zadd(key, mapping)

    async def zrangebyscore(self, key: str, min_score: float, max_score: float, start: int = 0, num: int = -1) -> list:
        """Get sorted set by score range"""
        result = self.client.zrangebyscore(key, min_score, max_score)
        return result if result else []

    async def zrem(self, key: str, *members):
        """Remove from sorted set"""
        return self.client.zrem(key, *members)

    async def sadd(self, key: str, *members):
        """Add to set"""
        return self.client.sadd(key, *members)

    async def smembers(self, key: str) -> list:
        """Get all set members"""
        result = self.client.smembers(key)
        return list(result) if result else []

    async def srem(self, key: str, *members):
        """Remove from set"""
        return self.client.srem(key, *members)

    async def delete(self, *keys):
        """Delete keys"""
        return self.client.delete(*keys)

    async def expire(self, key: str, seconds: int):
        """Set key expiration"""
        return self.client.expire(key, seconds)

    async def exists(self, key: str) -> int:
        """Check if key exists"""
        result = self.client.exists(key)
        return 1 if result else 0

    def pipeline(self, transaction: bool = False):
        """
        Pipeline support (limited for Upstash)
        Upstash 不完全支持 pipeline,这里返回一个模拟的 pipeline
        """
        return UpstashPipelineAdapter(self.client, self)


class UpstashPipelineAdapter:
    """模拟 Pipeline 接口"""

    def __init__(self, client: Any, adapter: UpstashRedisAdapter):
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
        """执行所有命令"""
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


async def connect_redis() -> None:
    """初始化 Redis 连接"""
    global _redis_client
    client = get_redis_client()
    if client:
        _redis_client = client
        print("[Redis] Connected successfully")
    else:
        print("[Redis] Not configured, running without cache")


async def close_redis() -> None:
    """关闭 Redis 连接"""
    global _redis_client
    if _redis_client and hasattr(_redis_client, 'close'):
        try:
            if hasattr(_redis_client, 'aclose'):
                await _redis_client.aclose()
            else:
                _redis_client.close()
        except Exception as e:
            print(f"[Redis] Error closing connection: {e}")
    _redis_client = None
