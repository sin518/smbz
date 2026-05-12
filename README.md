# sm1

项目已拆分为前后端目录：

- `frontend/`：Next.js App Router 前端
- `backend/`：FastAPI 后端
- `backend/prisma/schema.prisma`：从原项目迁移来的数据库结构参考

## 启动后端

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

## 启动前端

```bash
cd frontend
npm install
npm run dev
```

前端默认会把 `/api/*` 代理到 `http://127.0.0.1:8000`。如需改后端地址，可在前端环境变量里设置 `NEXT_PUBLIC_API_BASE_URL`。
