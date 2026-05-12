# sm1 FastAPI Backend

FastAPI 后端承接原 Next.js API Route 的服务端能力，前端通过 `/api/*` 代理访问。

## 本地启动

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

## 已迁移接口

- `GET /api/health`
- `GET /api/auth/get-session`
- `POST /api/auth/verification-code`
- `POST /api/auth/login`
- `POST /api/auth/password/register`
- `POST /api/auth/password/login`
- `POST /api/auth/logout`
- `POST /api/auth/delete-account`
- `GET /api/profiles`
- `POST /api/profiles`

第三方 OAuth 登录仍需要后续接入独立 Python OAuth 流程，目前会返回不可用提示。
