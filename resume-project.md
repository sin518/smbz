# 赛博八字 — AI 驱动的中国传统命理分析平台

## 项目简介

全栈占术应用，集成八字、六爻、紫微斗数、奇门遁甲四大中国传统命理体系，结合 AI 大模型提供智能解读。支持 MCP（Model Context Protocol）协议，可作为外部 AI 工具调用的命理计算引擎。

## 技术栈

- **前端**: Next.js 16 (App Router) · React 19 · TypeScript (strict) · TailwindCSS · React Hook Form + Zod
- **后端**: FastAPI · Pydantic · asyncpg · Redis
- **数据库**: PostgreSQL (Neon) · Prisma Schema 设计
- **AI**: 大模型 Prompt Engineering · 结构化命理数据 → AI 解读管线 · MCP 协议层
- **部署**: Railway (前后端分离部署) · pnpm Monorepo
- **核心库**: 自研 `@mingai/core` SDK，npm 发布，封装 15+ 命理计算系统

## 核心职责

### 1. 命理计算引擎设计与实现

- 纯函数架构实现八字四柱排盘、十神关系、大运流年、神煞、长生十二宫等专业计算
- 基于 `iztro` / `lunar-typescript` / `liuren-ts-lib` 等库二次封装紫微斗数飞星、六爻纳甲、奇门遁甲排盘
- 计算层与展示层彻底分离：前端展示 + AI 解读均复用同一套核心函数，保证结果一致性

### 2. AI 智能解读管线

- 设计 Prompt 模板系统，覆盖事业、财运、婚姻、健康等 8 个解读维度
- 构建 `divination-pipeline` 标准化管道：鉴权 → 会员校验 → 积分扣减 → 模型调用 → 流式输出 → 持久化 → 失败退款
- 多 AI 网关路由（newapi / octopus），支持 reasoning 模式、vision 模型、温度/长度按模型独立配置

### 3. MCP 协议层开发

- 为每个命理系统设计标准化 MCP Tool（输入 Schema / 输出 Schema / 执行逻辑）
- 实现 MCP Server：OAuth 鉴权、API Key 缓存、请求中间件
- 使核心计算能力可被 Claude / Cursor 等 AI Agent 直接调用

### 4. 全栈用户系统

- 邮箱/密码 + 手机短信双通道注册登录
- Session-based 鉴权（httpOnly Cookie），支持 IP/UserAgent 追踪
- Google / GitHub OAuth 对接
- 会员体系（free / plus / pro）+ 积分系统 + 限流控制

### 5. 前端架构与体验优化

- Next.js App Router，Server Component 优先，按需使用 `'use client'`
- 离线优先策略：未登录时 localStorage 本地存储排盘记录，登录后自动同步至服务端
- 骨架屏加载、Toast 通知体系、响应式移动端适配
- 业务逻辑下沉至 `src/lib/*`，页面层保持轻量

## 架构亮点

- **计算与解读分离**: 命理排盘 100% 本地纯函数完成，AI 仅负责解读结构化数据，避免模型幻觉影响计算准确性
- **Monorepo 工程化**: pnpm workspace 管理核心库、MCP 层、服务端、前端，共享类型与逻辑
- **渐进式增强**: 核心功能无需登录即可使用，登录后解锁云端同步、AI 解读、历史记录等增值能力
- **MCP 标准化**: 将领域专长（命理计算）封装为 AI Agent 可调用的标准化工具，具备通用集成能力

## 成果

- 封装 `@mingai/core` SDK，覆盖八字、紫微、六爻、奇门、梅花、太乙、塔罗等 15+ 命理系统
- 完整实现前后端 + MCP 协议层，支持 Web 端和 AI Agent 双入口访问
- Railway 一键部署，前后端独立扩缩容

---

# STAR 法则展开

## 1. 命理计算引擎

**Situation**: 项目需要同时支持八字、六爻、紫微斗数、奇门遁甲四套完全不同的命理体系，每套体系涉及天文历法转换、干支推演、五行生克等高度专业的算法，且前端展示和后续的 AI 解读都需要同一份计算结果。

**Task**: 构建一套高精度、可复用的命理计算核心库，保证计算结果在前端渲染和 AI 解读之间完全一致，避免出现"同一命盘两种结果"的问题。

**Action**:
- 采用纯函数架构，所有排盘逻辑无副作用，输入出生时间即输出结构化命盘数据
- 对 `iztro`（紫微）、`lunar-typescript`（农历）、`liuren-ts-lib`（六爻）等专业库做二次封装，统一输出格式
- 将核心库抽取为 `@mingai/core` npm 包，通过 pnpm workspace 供前端和 MCP Server 共同依赖
- 实现四柱排盘、十神关系、大运流年、神煞、长生十二宫等完整计算模块

**Result**: 封装覆盖 15+ 命理系统的 SDK，Web 端和 MCP Agent 共用同一计算引擎，结果零差异；后续新增命理系统仅需添加模块，无需改动上层架构。

---

## 2. AI 智能解读管线

**Situation**: 用户排完命盘后需要专业解读。传统做法是前端直接调用 AI 接口，但这导致鉴权、积分扣减、模型选择、失败重试等逻辑散落在前端，难以维护且存在安全风险。

**Task**: 设计一条标准化的 AI 解读管道，将鉴权、计费、模型调用、结果持久化全部收敛到后端，前端只负责触发和展示。

**Action**:
- 构建 `divination-pipeline` 七步管道：鉴权 → 会员校验 → 积分扣减 → 模型访问控制 → AI 流式调用 → 对话持久化 → 失败自动退款
- 设计 Prompt 模板系统，按命理类型和解读维度（事业/财运/婚姻/健康等 8 个维度）动态组装结构化 Prompt
- 实现多 AI 网关路由（newapi / octopus），支持 reasoning 模式、vision 模型，温度和最大 token 按模型独立配置
- 通过 `createAIAnalysisConversation` 统一持久化 source 和 conversation，保证审计链路完整

**Result**: 前端只需一个按钮即可触发完整解读流程；积分扣减与退款自动化，失败场景无资金损失；多网关路由实现模型弹性切换，单网关故障不中断服务。

---

## 3. MCP 协议层 — 让命理能力成为 AI Agent 的标准工具

**Situation**: 命理计算引擎能力强大但仅限 Web 端调用。随着 Claude / Cursor 等 AI Agent 兴起，需要让核心计算能力以标准化方式被外部 AI 工具调用，而不仅限于自有前端。

**Task**: 将命理计算能力封装为 MCP（Model Context Protocol）标准工具，使任何支持 MCP 的 AI Agent 都能直接调用排盘和推演功能。

**Action**:
- 为每个命理系统定义 MCP Tool 三要素：`definition.ts`（工具名/描述/输入 Schema）、`output-schema.ts`（输出格式）、`tool.ts`（执行逻辑）
- 实现 MCP Server，包含 OAuth 鉴权流程、API Key 缓存机制、请求中间件
- 通过 `executeTool()` + `renderToolResult()` 统一工具执行与结果渲染
- 支持 15+ 工具：Bazi、Ziwei、Liuyao、Qimen、Meihua、Taiyi、Tarot、Astrology 等

**Result**: 核心计算能力从单一 Web 入口扩展为通用 AI Agent 工具集，可在 Claude Desktop / Cursor 等任意 MCP Host 中直接使用；新增命理系统只需按模板添加 Tool 定义，Server 零改动。

---

## 4. 全栈用户与会员体系

**Situation**: 应用需要从"免登录即可用"的基础模式升级为支持注册用户、会员分层、积分计费的商业化产品。鉴权链路涉及邮箱密码、手机短信、第三方 OAuth 三种方式，需统一管理。

**Task**: 构建完整的用户注册登录体系和会员积分系统，支持多通道认证，并为 AI 解读等增值功能提供计费基础。

**Action**:
- 实现双通道注册：邮箱/密码 + 手机短信验证码，统一 Session 管理（httpOnly Cookie，IP/UserAgent 追踪）
- 对接 Google / GitHub OAuth，Account 模型支持多 Provider 绑定
- 设计会员三级体系（free / plus / pro），不同层级对应不同 AI 模型访问权限
- 积分系统与 AI 管线深度集成：调用前校验余额、扣减、失败自动退款
- 管理员接口使用 `requireAdminContext()` 隔离，RSL bypass 仅限 `getSystemAdminClient()` 服务端使用

**Result**: 用户可通过任意一种方式注册登录；会员分层实现模型访问的差异化定价；积分链路（校验→扣减→退款）完整闭环，零资金异常。

---

## 5. 前端架构与离线优先体验

**Situation**: 目标用户以移动端为主，网络环境不稳定，且命理排盘本身是纯本地计算，不应强依赖网络。同时需要在登录后无缝同步本地数据到云端。

**Task**: 打造移动端优先的流畅体验，核心功能离线可用，登录后自动同步；页面加载无白屏，交互反馈即时。

**Action**:
- Next.js App Router，Server Component 优先渲染，仅在交互逻辑处使用 `'use client'`
- 离线优先策略：未登录时排盘记录存入 localStorage，登录后自动同步至服务端 PostgreSQL
- 骨架屏替代白屏加载，Toast 通知体系替代 `alert`，React Hook Form + Zod 保证表单校验一致性
- 业务逻辑全部下沉至 `src/lib/*`（bazi / ziwei / qimen / liuyao 各有独立计算模块 + AI command builder），页面层保持薄组件
- 静态常量提取到组件外，昂贵计算使用 `useMemo`，透传函数使用 `useCallback`

**Result**: 核心排盘功能完全离线可用；登录后历史记录自动同步，无数据丢失；移动端首屏骨架屏加载 < 1s，交互无卡顿；新增页面只需组合已有 lib 模块，开发效率高。
