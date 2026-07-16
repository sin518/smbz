# Vercel + Upstash Redis 配置指南

## 第一步: 注册并创建 Upstash Redis

### 1. 注册 Upstash
1. 访问 https://console.upstash.com/
2. 使用 GitHub 账号登录(推荐)或邮箱注册
3. 完全免费,无需信用卡

### 2. 创建 Redis 数据库
1. 点击 **Create Database**
2. 配置:
   - **Name**: `sm1-redis` (或任意名称)
   - **Type**: 选择 **Regional** (免费)
   - **Region**: 选择离你用户最近的区域(如 `ap-southeast-1` - Singapore)
   - **Eviction**: 选择 **noeviction** (不自动删除数据)
3. 点击 **Create**

### 3. 获取连接信息
创建完成后,在 Database 页面找到:

**方式 1: REST API (推荐用于 Vercel Serverless)**
```
UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=AxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxQ==
```

**方式 2: Redis 协议 URL**
```
REDIS_URL=rediss://:AxxxxxxxxxxxQ==@xxx.upstash.io:6379
```

> ⚠️ Vercel Serverless 推荐使用 **REST API** 方式,因为每次请求都是新的连接,REST 更高效。

## 第二步: 修改后端代码支持 Upstash REST

由于 Vercel Serverless 的特性,我们需要使用 Upstash 的 REST API 而不是传统的 Redis 协议。

### 安装 Upstash Redis SDK

在 `backend` 目录执行:
```bash
pip install upstash-redis
pip freeze > requirements.txt
```

### 更新 Redis 客户端代码

我已经为你创建了兼容 Upstash 的 Redis 客户端,见下一个文件。

## 第三步: 配置 Vercel 环境变量

### 1. 进入 Vercel 项目设置
1. 访问 https://vercel.com/dashboard
2. 选择你的项目
3. 点击 **Settings** → **Environment Variables**

### 2. 添加以下环境变量

#### Redis 配置 (必需)
```
UPSTASH_REDIS_REST_URL
值: https://xxx.upstash.io
环境: Production, Preview, Development
```

```
UPSTASH_REDIS_REST_TOKEN
值: AxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxQ==
环境: Production, Preview, Development
```

#### 或者使用传统 Redis URL (如果不用 REST API)
```
REDIS_URL
值: rediss://:password@host.upstash.io:6379
环境: Production, Preview, Development
```

#### 定时任务密钥 (必需)
```
CRON_SECRET
值: (从 backend/.env 复制你的 CRON_SECRET)
环境: Production, Preview, Development
```

#### 数据库和其他配置 (如果还没配置)
```
DATABASE_URL
值: postgresql://user:password@host:5432/database
环境: Production, Preview, Development
```

```
SESSION_SECRET
值: (你的 session secret)
环境: Production, Preview, Development
```

### 3. 重新部署

添加环境变量后:
1. 回到 **Deployments** 标签
2. 点击最新的部署右侧的 **...** 菜单
3. 选择 **Redeploy**
4. 确认 **Redeploy**

或者直接推送新代码:
```bash
git add .
git commit -m "feat: 支持 Upstash Redis"
git push
```

Vercel 会自动检测到新的环境变量并重新部署。

## 第四步: 配置 GitHub Actions

### 1. 添加 GitHub Secrets

进入 GitHub 仓库: https://github.com/your-username/your-repo
1. 点击 **Settings** → **Secrets and variables** → **Actions**
2. 点击 **New repository secret**

添加两个 Secret:

**BACKEND_URL**
```
名称: BACKEND_URL
值: https://your-app.vercel.app
(你的 Vercel 项目地址)
```

**CRON_SECRET**
```
名称: CRON_SECRET
值: (从 backend/.env 复制,与 Vercel 环境变量中的相同)
```

### 2. 启用 GitHub Actions

1. 进入仓库的 **Actions** 标签页
2. 找到 "Sync Pending Records" workflow
3. 点击 **Enable workflow** (如果需要)
4. 点击 **Run workflow** 手动测试一次

## 验证配置

### 1. 测试后端 API

```bash
# 测试健康检查
curl https://your-app.vercel.app/api/health

# 测试待同步接口(需要登录 Cookie)
curl https://your-app.vercel.app/api/sync/pending \
  -H "Cookie: sm1_session=YOUR_SESSION"
```

### 2. 查看 Upstash 数据

进入 Upstash Console → 你的数据库 → **Data Browser**
可以看到保存的 Redis keys:
- `pending:records:*`
- `pending:records:queue`
- `pending:records:user:*`

### 3. 查看 GitHub Actions 日志

进入 GitHub → Actions 标签页 → 点击最新的运行记录
应该看到类似输出:
```
HTTP Status: 200
Response: {"synced":3,"failed":0,"total":3}
```

## 常见问题

### Q: Vercel 部署后 Redis 连接失败
A: 检查:
1. 环境变量是否正确添加
2. Upstash URL 是否以 `https://` 开头(REST API)
3. 重新部署项目使环境变量生效

### Q: GitHub Actions 显示 401 Unauthorized
A: 检查 `CRON_SECRET` 是否与后端环境变量中的完全一致

### Q: 数据没有同步到数据库
A: 
1. 查看 GitHub Actions 日志
2. 检查 Upstash 中是否有待同步的 keys
3. 手动调用同步接口测试

### Q: Upstash 免费套餐限制
免费套餐限制:
- 10,000 命令/天
- 256 MB 存储
- 对于本项目足够使用

## 成本估算

- Upstash Redis: **$0/月** (免费套餐)
- GitHub Actions: **$0/月** (公开仓库免费)
- Vercel: **$0/月** (Hobby 套餐)

总计: **完全免费** ✅
