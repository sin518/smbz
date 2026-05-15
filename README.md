# SM 命理排盘与 AI 分析

SM 是一款面向移动端体验优先的命理排盘应用，当前仓库已拆分为前端与后端两部分。前端负责八字、紫微、奇门、六爻等排盘入口与结果展示，后端负责认证、用户资料、排盘记录等服务端能力。

项目核心原则是：排盘计算与 AI 解读解耦。排盘结果由本地计算引擎生成，AI 只负责基于结构化结果进行解释、归纳和建议表达。

## 当前状态

- Monorepo 根目录提供前后端统一启动脚本，前端位于 `frontend/`，后端位于 `backend/`
- 前端已实现首页、八字、紫微、奇门、六爻、记录、设置与登录相关页面
- 八字排盘已拆分为前端纯函数模块，并支持本地记录与登录后服务端保存
- 后端已从原 Next.js API Route 迁移到 FastAPI，保留 `backend/legacy-next/` 作为迁移参考
- 数据库使用 PostgreSQL / Neon，Prisma schema 作为数据模型参考，后端运行时通过 `asyncpg` 访问数据库
- Redis 已作为可选缓存接入，用于登录会话和用户资料读取缓存；未配置或连接失败时会自动退回数据库读取
- AI 分析 Prompt 已独立放在 `frontend/src/prompts/bazi-analysis.ts`，当前 AI 报告持久化仍待实现

## 技术栈

- 前端：Next.js App Router、React 19、TypeScript、TailwindCSS
- 表单与校验：React Hook Form、Zod
- 命理计算：TypeScript 纯函数模块，部分逻辑使用 `lunar-typescript`
- 后端：FastAPI、Pydantic、asyncpg
- 数据库：PostgreSQL / Neon，`backend/prisma/schema.prisma` 保留 Prisma 数据模型参考
- 缓存：Redis，可选启用，用于 Session 和资料列表缓存
- 认证：后端 Session、验证码、密码登录接口，OAuth 接入预留

## 目录结构

```txt
.
├── frontend/                  # Next.js 前端应用
│   ├── src/app/               # App Router 页面
│   │   ├── page.tsx           # 首页
│   │   ├── bazi/              # 八字排盘与演示分析
│   │   ├── ziwei/             # 紫微斗数
│   │   ├── qimen/             # 奇门遁甲
│   │   ├── liuyao/            # 六爻
│   │   ├── records/           # 记录页
│   │   └── settings/          # 设置与登录
│   ├── src/components/        # 页面组件与业务组件
│   ├── src/lib/               # 排盘、AI 指令、主题、工具函数
│   │   ├── bazi/              # 八字计算模块
│   │   ├── ziwei/             # 紫微计算模块
│   │   ├── qimen/             # 奇门计算模块
│   │   ├── liuyao/            # 六爻起卦与排盘模块
│   │   └── ai/                # AI 指令与演示报告
│   └── src/prompts/           # 独立 Prompt 文件
├── backend/                   # FastAPI 后端
│   ├── app/api/routes/        # API 路由
│   ├── app/core/              # 配置与 OAuth 基础设施
│   ├── app/schemas/           # Pydantic 数据结构
│   ├── app/services/          # 业务服务
│   ├── prisma/schema.prisma   # 数据模型参考
│   └── legacy-next/           # 原 Next.js API Route 迁移参考
├── image/                     # UI 参考图与历史素材
├── 主页/                      # 首页、用户页、设置页等参考素材
└── 六爻/                      # 六爻页面与分类素材
```

## 当前功能

- 首页命理工具入口与底部导航
- 八字排盘输入、演示命盘、本地记录页与登录后保存
- 八字专业信息展示、干支解读、AI 指令弹窗
- 紫微斗数排盘入口、资料页、命盘页
- 奇门遁甲排盘入口与结果页
- 六爻起卦、摇卦与结果页
- 记录页、设置页、账号名称展示与登录入口
- 登录、注册、验证码、会话、资料保存、八字排盘保存与读取等后端接口
- 前端 `/api/*` 自动代理到后端服务

## 本地开发

### 1. 准备后端环境

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
```

编辑 `backend/.env` 后启动服务：

```bash
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

后端默认运行在：

```txt
http://127.0.0.1:8000
```

健康检查：

```txt
GET /api/health
```

### 2. 准备前端环境

```bash
cd frontend
npm install
cp .env.example .env.local
```

启动服务：

```bash
npm run dev
```

前端默认运行在：

```txt
http://127.0.0.1:3000
```

前端会将 `/api/*` 请求代理到 `http://127.0.0.1:8000`。如需修改后端地址，可在前端环境变量中设置：

```bash
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8000
```

## 环境变量

后端环境变量从 `backend/.env` 读取。请基于 `backend/.env.example` 创建本地配置，不要提交真实 `.env` 文件。

```env
DATABASE_URL=postgresql://user:password@host:5432/dbname
REDIS_URL=redis://localhost:6379/0
SESSION_SECRET=replace-with-a-long-random-secret
BETTER_AUTH_SECRET=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
SMS_PROVIDER=development
ENVIRONMENT=development
FRONTEND_ORIGINS=http://127.0.0.1:3000,http://localhost:3000
FRONTEND_URL=http://127.0.0.1:3000
```

`REDIS_URL` 是可选配置。配置后后端会在启动时连接 Redis，并缓存会话与用户资料；不配置或 Redis 不可用时，服务仍会继续运行并直接访问 PostgreSQL。

前端环境变量从 `frontend/.env.local` 读取。请基于 `frontend/.env.example` 创建本地配置：

```env
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8000
```

## 常用命令

根目录 monorepo：

```bash
npm run dev:backend
npm run dev:frontend
npm run build:frontend
npm run typecheck
```

前端：

```bash
cd frontend
npm run dev
npm run build
npm run typecheck
npm run lint
```

后端：

```bash
cd backend
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

## Railway 部署

本仓库按 monorepo 管理，但 Railway 建议拆成两个 service 部署，分别设置 Root Directory：

1. `sm1-backend`
   - Root Directory：`backend`
   - Railway 会读取 `backend/railway.toml`
   - Start Command：`uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - 健康检查：`/api/health`
2. `sm1-frontend`
   - Root Directory：`frontend`
   - Railway 会读取 `frontend/railway.toml`
   - Build Command：`npm ci && npm run build`
   - Start Command：`npm run start -- -p $PORT`

后端 service 需要配置：

```env
DATABASE_URL=postgresql://...
SESSION_SECRET=replace-with-a-long-random-secret
ENVIRONMENT=production
FRONTEND_URL=https://your-frontend.up.railway.app
FRONTEND_ORIGINS=https://your-frontend.up.railway.app
```

前端 service 需要配置：

```env
NEXT_PUBLIC_API_BASE_URL=https://your-backend.up.railway.app
```

如果使用 Railway PostgreSQL，可以在后端 service 里引用 Railway 提供的 `DATABASE_URL`。首次部署时先部署后端，拿到后端域名后再配置前端的 `NEXT_PUBLIC_API_BASE_URL`；前端域名确定后，再回填后端的 `FRONTEND_URL` 和 `FRONTEND_ORIGINS`。

## API 概览

当前后端已提供：

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
- `GET /api/bazi/charts`
- `POST /api/bazi/charts`
- `GET /api/bazi/charts/{chart_id}`

第三方 OAuth 登录流程已有配置与服务基础，但仍需要继续接入完整 Python OAuth 回调流程。

## 数据模型

数据库结构参考位于 `backend/prisma/schema.prisma`，当前包含：

- `User`：用户基础信息
- `PasswordCredential`：密码凭证
- `Session`：登录会话
- `Account`：第三方账号绑定
- `Verification`：验证码
- `DivinationProfile`：命理资料记录
- `BaziProfile`：八字用户输入资料
- `BaziChart`：八字排盘 JSON 结果

后续 AI 报告、付费记录、导出记录等应继续拆表保存，避免把用户输入、计算结果和 AI 内容混在同一张表中。

## 命理模块约定

- 排盘逻辑必须放在 `frontend/src/lib/*` 的独立计算模块中
- 页面组件只负责交互、展示和调用，不直接承载复杂排盘规则
- 八字计算相关模块集中在 `frontend/src/lib/bazi/`
- AI Prompt 独立存放在 `frontend/src/prompts/`
- AI 只解释结构化排盘结果，不负责生成命盘
- 不确定的命理规则应保留 TODO，避免编造结论

## 开发规范

- 使用 TypeScript 严格类型，避免滥用 `any`
- 表单使用 React Hook Form + Zod，并提供明确错误提示
- 异步请求需要处理 loading、error、empty 状态
- 不在前端暴露 API Key
- 不把长 Prompt 写在页面组件或 API Route 中
- 不提交 `.env`、构建产物、缓存文件和真实密钥
- 新功能优先保持小步提交，避免一次性大改整个项目

## 产品路线

### MVP

- [x] 基础页面框架
- [x] 八字输入、演示排盘与分析页面
- [x] 紫微、奇门、六爻入口与结果页
- [x] 登录与用户资料后端接口
- [x] 完整八字输入表单
- [x] 八字计算结果服务端持久化
- [ ] AI 分析报告持久化

### 第二阶段

- [ ] 历史记录完善
- [ ] 报告导出
- [ ] 会员限制
- [ ] 分享海报
- [ ] OAuth 登录闭环

### 第三阶段

- [ ] AI 问答
- [ ] 合盘分析
- [ ] 流年专题分析
- [ ] 财运专题分析
- [ ] 命理知识库 + RAG

## 重要提醒

本项目输出的 AI 分析应作为文化娱乐与自我观察辅助，不应表达为宿命论、医疗诊断、投资保证或婚姻绝对判断。所有建议都应保持清晰、克制、现实可执行。
