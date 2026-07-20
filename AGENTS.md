# AGENTS.md

默认使用中文回答。修改前先理解现有实现，保持改动聚焦，并以可维护性、边界条件和回归风险为主要审查维度。

## 项目概览

- 根目录：前后端统一脚本与工作区配置。
- `frontend/`：Next.js App Router、React、TypeScript、Tailwind CSS。
- `frontend/packages/core/`：前端使用的本地排盘计算包 `taibu-core`。
- `backend/`：FastAPI、Pydantic、asyncpg；Redis 为可选缓存。
- `backend/prisma/schema.prisma`：当前数据模型参考，不代表运行时使用 Prisma Client。
- `.github/workflows/`：GitHub Actions，包括定时同步任务。

前端负责排盘计算和展示，后端负责认证、用户资料、云端记录及 AI 分析等服务端能力。不要把 AI 解读逻辑混入确定性的排盘计算逻辑。

## 常用命令

```bash
pnpm install
pnpm dev
pnpm build:frontend
pnpm typecheck
pnpm lint
cd backend && .venv/bin/python -m unittest discover -s tests -p 'test_*.py'
```

- 根目录没有 `pnpm test` 脚本，不要声称执行过不存在的命令。
- 后端命令依赖 `backend/.venv`；如果虚拟环境不存在，先按 `README.md` 创建并安装 `backend/requirements.txt`。
- 仓库目前同时存在多种锁文件。除非任务明确涉及依赖管理，不要顺手重建或批量改动锁文件。

## 开始修改前

1. 使用搜索定位已有实现、调用链和测试，优先复用，避免平行模块。
2. 检查当前工作区修改，保留用户的无关改动。
3. 结构归属、接口契约或数据库方案不明确时，先确认再落盘。
4. 不要未经明确要求新增核心目录、基础设施或数据库主表。

## 后端规范

- API 路由位于 `backend/app/api/routes/`，由 `backend/app/api/router.py` 统一注册。
- Pydantic 请求/响应模型放在 `backend/app/schemas/`，业务与数据访问逻辑优先放在 `backend/app/services/`；路由保持轻量。
- 数据库运行时使用 `asyncpg`。通过 `backend/app/db.py` 的连接依赖或受控连接上下文访问数据库，使用参数化 SQL，禁止拼接用户输入。
- 需要登录的接口必须复用现有 Session 校验方式，并确保查询、更新、删除都按当前用户 ID 限定，防止越权。
- 管理员、定时任务和同步接口必须复用各自现有鉴权方式，不要自行引入第二套鉴权协议。
- 保持现有错误响应约定；新增全局错误格式前先评估前端兼容性。
- Redis 不可用时系统应能按现有设计回退数据库；不要让可选缓存变成启动或请求的硬依赖。
- 日志不得输出密码、验证码、Session、Token、数据库连接串或完整用户隐私数据。

## 前端规范

- 默认使用 Server Component；仅在需要 hooks、浏览器 API 或交互状态时使用 `'use client'`。
- 使用 `@/` 别名引用 `frontend/src` 下模块。
- 页面层保持轻量，业务逻辑优先下沉到 `frontend/src/lib/`、`frontend/packages/core/` 或对应业务组件。
- 新增排盘逻辑前先检查已有 `bazi`、`ziwei`、`qimen`、`liuyao`、`daliuren` 模块，不要在页面内复制计算或格式化逻辑。
- 禁止使用浏览器 `alert`；复用项目现有反馈组件或 Toast 方案。
- 保持 TypeScript strict，不引入无必要的 `any`、`@ts-ignore` 或不安全类型断言。
- 保持现有 Tailwind 与 CSS variables 视觉体系，优先移动端体验，并覆盖 loading、空数据、错误和未登录状态。
- 只有在确有性能问题或稳定引用需求时使用 `useMemo`/`useCallback`，不要机械添加。

## 数据库与环境变量

- 新增表或字段前先检查 `backend/prisma/schema.prisma` 和现有 SQL 使用位置，并说明为什么不能复用现有结构。
- 数据库结构变更必须采用可审查、可重复执行的迁移方式；当前仓库没有明确的 migration 目录时，先与用户确认迁移工具和落盘位置，禁止直接修改线上数据库。
- 结构变更必须评估索引、唯一约束、默认值、旧数据回填、向后兼容和回滚方案。
- 环境变量以 `frontend/.env.example` 和 `backend/.env.example` 为准。新增变量时同步更新示例和相关文档。
- 严禁提交真实密钥、Token、连接串或包含真实用户信息的测试数据。

## 测试与验收

- 纯文案或样式修改：至少手动验证相关页面及移动端布局。
- `frontend/src/lib/` 或 `frontend/packages/core/` 业务逻辑变更：补充或更新相应测试；若当前区域没有测试基础设施，明确说明并给出可复现的手动验证步骤。
- FastAPI 路由或 Service 变更：补充后端测试，至少覆盖成功路径和一个失败或权限边界。
- 涉及鉴权、云端记录同步、幂等性、AI 数据持久化或定时任务：必须增加回归测试。
- 完成后先运行受影响范围的检查，再按风险运行 `pnpm typecheck`、`pnpm lint`、`pnpm build:frontend` 和后端测试。
- 不能执行的验证要说明原因，不得把未执行写成已通过。

## Git 与交付

- Commit message 使用 Conventional Commits：`feat:`、`fix:`、`refactor:`、`chore:`、`docs:`、`test:`。
- 默认不要直接提交或推送。需要提交或推送时，先说明 `git add .` 会暂存全部修改、可能夹带无关内容，且推送可能触发 CI/CD 或部署；随后提供恰好三条可复制命令并等待用户决定：`git add .`、动态 Conventional Commit、`git push`。
- 交付说明应包含：改了什么、为什么改、如何验证、未验证项，以及风险和回滚点。

## 完成检查

- [ ] 改动范围聚焦，没有无关重构。
- [ ] 复用了现有模块，没有重复实现。
- [ ] 鉴权、用户数据隔离和敏感信息处理正确。
- [ ] 错误路径和边界条件已覆盖。
- [ ] 相关测试、类型检查、Lint 或构建已通过，或明确说明未执行原因。
- [ ] 接口、环境变量、数据库或行为变化已同步文档。
