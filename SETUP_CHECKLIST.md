# Vercel + Upstash Redis 配置完成清单

## ✅ 已完成的工作

### 后端代码更新
- ✅ 安装 `upstash-redis` 依赖包
- ✅ 更新 `app/redis.py` 支持 Upstash REST API
- ✅ 创建 Redis 适配器(自动兼容 Upstash 和传统 Redis)
- ✅ 更新 `requirements.txt`

### GitHub Actions
- ✅ 创建定时同步 workflow (`.github/workflows/sync-records.yml`)
- ✅ 每 5 分钟执行一次同步任务

## 📋 接下来需要你做的事

### 1️⃣ 注册 Upstash 并创建数据库

1. **访问** https://console.upstash.com/
2. **登录** - 使用 GitHub 账号(推荐)
3. **创建数据库**:
   - 点击 **Create Database**
   - Name: `sm1-redis`
   - Type: **Regional** (免费)
   - Region: 选择 **ap-southeast-1** (Singapore,离中国最近)
   - Eviction: **noeviction**
   - 点击 **Create**

4. **获取连接信息** - 在数据库详情页找到:
   ```
   UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
   UPSTASH_REDIS_REST_TOKEN=AxxxxxxxxxxxQ==
   ```

### 2️⃣ 配置 Vercel 环境变量

1. **访问** https://vercel.com/dashboard
2. **选择你的项目**
3. **进入** Settings → Environment Variables
4. **添加以下变量**:

   ```
   名称: UPSTASH_REDIS_REST_URL
   值: https://xxx.upstash.io (从 Upstash 复制)
   环境: Production, Preview, Development (全选)
   ```

   ```
   名称: UPSTASH_REDIS_REST_TOKEN
   值: AxxxxxxxxxxxQ== (从 Upstash 复制)
   环境: Production, Preview, Development (全选)
   ```

   ```
   名称: CRON_SECRET
   值: (从 backend/.env 复制你的 CRON_SECRET)
   环境: Production, Preview, Development (全选)
   ```

5. **重新部署**:
   - 方式1: 推送新代码会自动触发
   - 方式2: Deployments 页面点击 "Redeploy"

### 3️⃣ 配置 GitHub Secrets

1. **访问** https://github.com/your-username/your-repo
2. **进入** Settings → Secrets and variables → Actions
3. **添加两个 Secret**:

   ```
   名称: BACKEND_URL
   值: https://your-app.vercel.app
   (你的 Vercel 项目地址,不要有结尾斜杠)
   ```

   ```
   名称: CRON_SECRET
   值: (从 backend/.env 复制,与 Vercel 中的相同)
   ```

### 4️⃣ 提交并推送代码

```bash
cd /Users/sin/Desktop/sm1
git add .
git commit -m "feat: 添加 Redis 本地缓存和 Upstash 支持"
git push
```

推送后:
- Vercel 会自动部署新代码
- GitHub Actions 会自动启用 workflow

### 5️⃣ 启用并测试 GitHub Actions

1. **进入** Actions 标签页
2. **找到** "Sync Pending Records" workflow
3. **点击** "Run workflow" 手动测试
4. **查看日志** 确认运行成功

## 🔍 验证配置

### 测试 1: 检查后端启动日志

Vercel 部署完成后,查看 Function Logs,应该看到:
```
[redis] Using Upstash REST API
[redis] Upstash connected
```

### 测试 2: 创建排盘记录

```bash
# 在本地或 Postman 测试
curl -X POST "https://your-app.vercel.app/api/bazi/charts" \
  -H "Content-Type: application/json" \
  -H "Cookie: sm1_session=YOUR_SESSION" \
  -d '{
    "name": "测试",
    "gender": "male",
    "birth_date": "1990-01-01",
    "birth_time": "12:00"
  }'
```

返回中应该包含 `"isPending": true`

### 测试 3: 查看 Upstash 数据

1. 进入 Upstash Console → 你的数据库 → **Data Browser**
2. 应该能看到以下 keys:
   - `pending:records:bazi:{uuid}`
   - `pending:records:bazi:{uuid}:meta`
   - `pending:records:queue`
   - `pending:records:user:{userId}`

### 测试 4: 手动触发同步

```bash
curl -X POST "https://your-app.vercel.app/api/sync/records" \
  -H "Content-Type: application/json" \
  -H "Cookie: sm1_session=YOUR_SESSION" \
  -d '{}'
```

返回:
```json
{
  "success": true,
  "message": "已同步 1 条记录到云端",
  "synced": 1,
  "failed": 0
}
```

### 测试 5: 查看 GitHub Actions 运行

进入 Actions 标签页,应该看到:
- 每 5 分钟自动运行
- 状态为绿色 ✅
- 日志显示 HTTP 200

## 🎯 架构说明

```
用户创建排盘
    ↓
Vercel Backend (FastAPI)
    ↓
优先保存到 Upstash Redis (本地缓存)
    ↓
返回 isPending: true
    ↓
10分钟后 (或手动触发)
    ↓
GitHub Actions 定时任务
    ↓
调用 /api/cron/sync-records
    ↓
从 Redis 读取待同步记录
    ↓
批量写入 PostgreSQL
    ↓
删除 Redis 缓存
```

## 📊 成本

- Upstash Redis: **$0/月** (免费 10,000 命令/天)
- GitHub Actions: **$0/月** (公开仓库免费)
- Vercel: **$0/月** (Hobby 套餐)

**总计: 完全免费** ✅

## 🚨 常见问题

**Q: 如何查看定时任务是否正常运行?**
A: GitHub → Actions 标签页,查看运行历史

**Q: 如何手动触发同步?**
A: 调用 `POST /api/sync/records` 或在前端添加"手动上传"按钮

**Q: Redis 数据会过期吗?**
A: 会,24小时后自动过期(防止占用过多空间)

**Q: Upstash 免费额度够用吗?**
A: 够用。每次排盘约 5 个 Redis 命令,10,000/天 可支持 2,000 次排盘

**Q: 如何改为每分钟同步?**
A: GitHub Actions 不支持,可以使用 cron-job.org (免费外部服务)

## 📚 相关文档

- `REDIS_SYNC_IMPLEMENTATION.md` - 完整实现文档
- `GITHUB_ACTIONS_SETUP.md` - GitHub Actions 配置
- `backend/app/redis.py` - Redis 客户端代码
- `backend/app/services/pending_records.py` - 待同步记录管理
- `backend/app/services/sync_service.py` - 同步服务

## 下一步

前端 UI 还需要实现:
1. 待同步记录面板组件
2. 手动上传按钮  
3. "本地/已同步"状态标签

需要我继续实现前端部分吗?
