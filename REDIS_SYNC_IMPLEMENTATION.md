# Redis 本地缓存和延迟同步功能 - Python 后端实现

## 概述

已为你的 FastAPI 后端实现了 Redis 本地缓存和延迟同步功能。排盘记录创建后优先保存到 Redis,10分钟后自动同步到 PostgreSQL,也支持手动立即上传。

## 已完成的工作

### 1. 核心服务层
- ✅ `app/services/pending_records.py` - 待同步记录管理(增删查改)
- ✅ `app/services/sync_service.py` - 记录同步到数据库的核心逻辑
- ✅ `app/services/record_save_helper.py` - 统一保存接口(优先本地缓存)

### 2. API 路由
- ✅ `app/api/routes/sync.py` - 手动同步和查询待同步记录
- ✅ `app/api/routes/cron.py` - 后台定时同步任务
- ✅ 修改 `app/api/routes/bazi.py` - 八字保存使用缓存
- ✅ 修改 `app/api/router.py` - 注册新路由

### 3. 配置更新
- ✅ `app/core/config.py` - 添加 cron_secret 配置
- ✅ `.env.example` - 添加 CRON_SECRET 说明

## Redis 数据结构

```
pending:records:bazi:{id}         - Hash: 记录完整数据
pending:records:bazi:{id}:meta    - Hash: 元数据
pending:records:queue             - Sorted Set: 按时间排序的同步队列
pending:records:user:{userId}     - Set: 用户的待同步记录ID列表
```

## API 接口

### 1. 获取待同步记录
```
GET /api/sync/pending
Cookie: sm1_session=...

Response:
{
  "items": [
    {
      "id": "uuid",
      "type": "bazi",
      "userId": "uuid",
      "createdAt": "2026-07-16T10:00:00Z",
      "scheduledSyncAt": 1721124600000
    }
  ],
  "count": 1,
  "redisAvailable": true
}
```

### 2. 手动同步所有记录
```
POST /api/sync/records
Cookie: sm1_session=...
Body: {}

Response:
{
  "success": true,
  "message": "已同步 3 条记录到云端",
  "synced": 3,
  "failed": 0
}
```

### 3. 手动同步单条记录
```
POST /api/sync/records
Cookie: sm1_session=...
Body: {
  "record_id": "uuid",
  "record_type": "bazi"
}
```

### 4. 定时同步任务(Cron)
```
GET /api/cron/sync-records
Authorization: Bearer {CRON_SECRET}

Response:
{
  "synced": 5,
  "failed": 0,
  "total": 5
}
```

## 使用方法

### 1. 配置环境变量
在 `backend/.env` 中添加:
```env
CRON_SECRET=your-random-secret-here
```

### 2. 重启后端服务
```bash
cd backend
source .venv/bin/activate
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

### 3. 设置定时任务
配置 Cron 任务每分钟调用一次同步接口:

**使用 GitHub Actions (推荐)**:
创建 `.github/workflows/sync-records.yml`:
```yaml
name: Sync Records
on:
  schedule:
    - cron: '* * * * *'  # 每分钟

jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - name: Call sync endpoint
        run: |
          curl -X GET "https://your-backend.railway.app/api/cron/sync-records" \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}"
```

**使用 Railway Cron**:
在 Railway 项目设置中添加 Cron Job:
```
Schedule: */1 * * * *
Command: curl -X GET "http://localhost:8000/api/cron/sync-records" -H "Authorization: Bearer $CRON_SECRET"
```

**本地测试**:
```bash
curl -X GET "http://127.0.0.1:8000/api/cron/sync-records" \
  -H "Authorization: Bearer your-cron-secret"
```

## 前端集成

前端需要创建UI组件来显示同步状态和手动上传按钮。参考实现:

### 待同步记录面板组件
```typescript
// frontend/src/components/sync/PendingRecordsPanel.tsx
import { useEffect, useState } from 'react';

export function PendingRecordsPanel() {
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/sync/pending', { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        setPending(data.items);
        setLoading(false);
      });
  }, []);

  const handleSync = async () => {
    const res = await fetch('/api/sync/records', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    const data = await res.json();
    alert(data.message);
    // 重新加载列表
    window.location.reload();
  };

  if (loading) return <div>加载中...</div>;

  return (
    <div className="border rounded-lg p-4">
      <h3>本地记录</h3>
      {pending.length === 0 ? (
        <p>当前没有需要上传的本地记录</p>
      ) : (
        <>
          <p>有 {pending.length} 条记录待上传</p>
          <button onClick={handleSync}>手动上传</button>
        </>
      )}
    </div>
  );
}
```

## 待完成的工作

### 高优先级
1. **其他排盘类型的保存接口** - 需要修改:
   - 如果有紫微、六爻、奇门等保存接口,也改用 `save_record_with_cache`

2. **前端UI集成**:
   - 在设置页面添加 `PendingRecordsPanel` 组件
   - 在记录列表显示"本地/已同步"标签

3. **数据库迁移** - 可选,如果想在数据库也记录同步状态:
```sql
ALTER TABLE bazi_charts ADD COLUMN sync_status TEXT DEFAULT 'synced';
CREATE INDEX idx_bazi_charts_sync_status ON bazi_charts(sync_status, user_id);
```

### 中优先级
4. **错误处理优化** - 同步失败时的重试机制
5. **同步统计** - 记录同步成功/失败次数
6. **批量同步优化** - 使用批量插入优化性能

## 测试步骤

1. **创建八字记录**:
```bash
curl -X POST "http://127.0.0.1:8000/api/bazi/charts" \
  -H "Content-Type: application/json" \
  -H "Cookie: sm1_session=your-session" \
  -d '{
    "name": "测试命盘",
    "gender": "male",
    "birth_date": "1990-01-01",
    "birth_time": "12:00"
  }'
```

2. **查看待同步列表**:
```bash
curl "http://127.0.0.1:8000/api/sync/pending" \
  -H "Cookie: sm1_session=your-session"
```

3. **手动同步**:
```bash
curl -X POST "http://127.0.0.1:8000/api/sync/records" \
  -H "Cookie: sm1_session=your-session" \
  -H "Content-Type: application/json" \
  -d '{}'
```

4. **验证数据库**:
```sql
SELECT * FROM bazi_charts WHERE user_id = 'your-user-id' ORDER BY created_at DESC LIMIT 1;
```

## 注意事项

1. **Redis 降级**: Redis 不可用时自动降级到直接保存数据库
2. **数据过期**: Redis 中的记录 24 小时后自动过期
3. **并发安全**: 使用 Redis pipeline 确保操作原子性
4. **CRON_SECRET**: 生产环境务必设置强密钥保护定时任务接口

## 项目文件清单

新增/修改的文件:
- `backend/app/services/pending_records.py` (新建)
- `backend/app/services/sync_service.py` (新建)
- `backend/app/services/record_save_helper.py` (新建)
- `backend/app/api/routes/sync.py` (新建)
- `backend/app/api/routes/cron.py` (新建)
- `backend/app/api/routes/bazi.py` (修改)
- `backend/app/api/router.py` (修改)
- `backend/app/core/config.py` (修改)
- `backend/.env.example` (修改)
