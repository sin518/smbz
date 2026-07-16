# Backend 依赖更新说明

## 新增依赖

为支持 Upstash Redis (Vercel Serverless 友好),需要添加以下依赖:

```txt
upstash-redis>=1.0.0
```

## 安装步骤

在 `backend` 目录执行:

```bash
cd backend
source .venv/bin/activate
pip install upstash-redis
pip freeze > requirements.txt
```

## 更新后的 requirements.txt

已包含:
- `redis` - 传统 Redis 客户端(降级方案)
- `upstash-redis` - Upstash REST API 客户端(Serverless 推荐)

两种客户端都保留,根据环境变量自动选择:
- 有 `UPSTASH_REDIS_REST_URL` 和 `UPSTASH_REDIS_REST_TOKEN` → 使用 Upstash
- 只有 `REDIS_URL` → 使用传统 Redis
- 都没有 → 降级到直接保存数据库
