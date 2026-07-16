# GitHub Actions 定时同步配置说明

## 已创建文件
`.github/workflows/sync-records.yml`

## 配置步骤

### 1. 添加 GitHub Secrets

进入你的 GitHub 仓库:
1. 点击 **Settings** → **Secrets and variables** → **Actions**
2. 点击 **New repository secret** 添加以下两个密钥:

**BACKEND_URL**
```
值: https://your-backend.railway.app
说明: 你的后端 API 地址(不要带结尾斜杠)
```

**CRON_SECRET**
```
值: (从 backend/.env 中的 CRON_SECRET 复制)
说明: 定时任务认证密钥
```

### 2. 启用 GitHub Actions

1. 进入仓库的 **Actions** 标签页
2. 如果提示启用 Workflow,点击 **I understand my workflows, go ahead and enable them**
3. 找到 "Sync Pending Records" workflow
4. 首次可以点击 **Run workflow** 手动测试

### 3. 验证运行

- 每5分钟会自动执行一次
- 在 **Actions** 标签页可以看到执行历史
- 点击具体的运行记录可以查看日志
- 失败时 GitHub 会发邮件通知

### 注意事项

- GitHub Actions 的 cron 最小间隔是 5 分钟(不是 1 分钟)
- 实际执行时间可能有 1-2 分钟延迟
- 如果仓库长期不活跃,GitHub 可能会暂停 scheduled workflows
- 公开仓库免费使用,私有仓库有每月配额限制

### 测试本地同步

在等待定时任务运行期间,可以手动测试:

```bash
# 创建一条八字记录(会保存到 Redis)
curl -X POST "http://127.0.0.1:8000/api/bazi/charts" \
  -H "Content-Type: application/json" \
  -H "Cookie: sm1_session=YOUR_SESSION_TOKEN" \
  -d '{
    "name": "测试",
    "gender": "male",
    "birth_date": "1990-01-01",
    "birth_time": "12:00"
  }'

# 查看待同步列表
curl "http://127.0.0.1:8000/api/sync/pending" \
  -H "Cookie: sm1_session=YOUR_SESSION_TOKEN"

# 手动触发同步(不等待10分钟)
curl -X POST "http://127.0.0.1:8000/api/sync/records" \
  -H "Content-Type: application/json" \
  -H "Cookie: sm1_session=YOUR_SESSION_TOKEN" \
  -d '{}'
```

### 如果想改为每分钟执行

GitHub Actions 无法实现真正的每分钟,但可以使用外部服务:
- https://cron-job.org (免费,支持每分钟)
- https://easycron.com (免费套餐支持每分钟)

配置方式:
1. 注册账号
2. 添加新任务
3. URL: `https://your-backend.railway.app/api/cron/sync-records`
4. HTTP Header: `Authorization: Bearer YOUR_CRON_SECRET`
5. 间隔: 每 1 分钟
