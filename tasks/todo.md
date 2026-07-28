# 八字四柱干支选择任务

## Task 1: 六十甲子与候选转换基础

**Acceptance criteria:**
- [x] 生成恰好 60 个传统干支，首项甲子、第二项乙丑、末项癸亥。
- [x] 不包含甲丑等阴阳不匹配组合。
- [x] 候选可以转换成现有表单使用的明确出生时间。

**Verification:**
- [x] 相关单元测试通过。

**Dependencies:** None

**Files likely touched:** `frontend/src/lib/bazi/`, 对应测试文件。

## Task 2: 八字专属时间选择弹窗

**Acceptance criteria:**
- [x] 公历与农历入口等宽。
- [x] 公历模式保持现有选择体验。
- [x] 农历模式显示四组传统六十甲子选择器及功能说明。

**Verification:**
- [x] TypeScript 类型检查通过。
- [x] 430px 视口手工检查通过。

**Dependencies:** Task 1

**Files likely touched:** `frontend/src/components/bazi/`, `frontend/src/components/shared/divination-profile-card.tsx`。

## Task 3: 候选确认状态

**Acceptance criteria:**
- [x] 无候选时显示错误并保持弹窗打开。
- [x] 单候选直接采用。
- [x] 多候选显示公历、农历和时辰，由用户选择。

**Verification:**
- [x] core 四柱往返测试通过。
- [ ] 手工覆盖空、单、多候选状态（已手工覆盖多候选；空、单候选由测试和代码路径验证）。

**Dependencies:** Tasks 1–2

**Files likely touched:** `frontend/src/components/bazi/`。

## Task 4: 表单与排盘接线

**Acceptance criteria:**
- [x] 确认候选后现有排盘流程成功执行。
- [x] 保存 `calendar: "pillars"` 及明确出生时间。
- [x] 公历提交行为保持不变。

**Verification:**
- [x] `pnpm typecheck`
- [x] `pnpm build:frontend`

**Dependencies:** Task 3

**Files likely touched:** `frontend/src/components/bazi/bazi-home-client.tsx`, `frontend/src/lib/bazi/api.ts`。

## Task 5: 回归验证

**Acceptance criteria:**
- [x] 受影响测试、类型检查、Lint 和构建完成或明确记录阻塞原因。
- [x] 没有无关文件和临时调试改动。

**Verification:**
- [x] `node --test frontend/packages/core/tests/bazi-enhancements.test.mjs`
- [x] `pnpm typecheck`
- [ ] `pnpm lint`（项目脚本仍调用 Next.js 16 已移除的 `next lint`，命令失败）。
- [x] `pnpm build:frontend`

**Dependencies:** Tasks 1–4

**Files likely touched:** 无新增业务文件。

---

# 全局点击式六十甲子时间选择

## Task 1: 六旬数据基础

**Acceptance criteria:**
- [x] 六旬起点依次为甲子、甲戌、甲申、甲午、甲辰、甲寅。
- [x] 每旬 10 项，总计 60 个且不含甲丑等无效组合。

**Verification:**
- [x] 六十甲子单元测试通过。

**Dependencies:** None

## Task 2: 共享点击式四柱面板

**Acceptance criteria:**
- [x] 年柱、月柱、日柱、时柱均通过点击选择。
- [x] 桌面端和手机端不使用滚轮交互。
- [x] 无、单、多候选状态有明确行为。

**Verification:**
- [x] 类型检查通过。
- [ ] 521px 视口手工检查通过；320px 未单独覆盖。

**Dependencies:** Task 1

## Task 3: 页面接入

**Acceptance criteria:**
- [x] 六爻、八字、紫微、奇门、大六壬均复用共享组件。
- [x] 公历选择与取消行为保持不变。
- [x] 不再保留页面内重复的六十甲子排列实现。

**Verification:**
- [ ] 手工验证八字、六爻和奇门；紫微、大六壬由共享组件接入和构建验证。
- [x] `pnpm typecheck` 与 `pnpm build:frontend` 通过。

**Dependencies:** Tasks 1–2

## Task 4: 最终审查

**Acceptance criteria:**
- [x] 无非法干支、静默回退或表单确认阶段的主线程暴力遍历。
- [x] 点击目标、焦点语义和错误提示适合移动端。

**Verification:**
- [x] `git diff --check` 通过。
- [x] 代码审查无必须修复项。

**Dependencies:** Task 3

---

# 排盘录入页视觉统一

## Task 1: 共享视觉基础

**Acceptance criteria:**
- [x] 八字当前标题、卡片和底部按钮样式提取为共享组件。
- [x] 共享组件支持嵌入模式和各模块徽章色。
- [x] 原表单逻辑与弹层行为不变。

**Verification:**
- [x] `pnpm typecheck`

**Dependencies:** None

## Task 2: 紫微与大六壬

**Acceptance criteria:**
- [x] 紫微保留地点选择弹层等现有未提交功能。
- [x] 两页均使用统一标题、分组卡片和底部操作区。

**Verification:**
- [x] 536px 与 320px 页面检查。

**Dependencies:** Task 1

## Task 3: 奇门与六爻

**Acceptance criteria:**
- [x] 奇门嵌入模式不出现固定头部或固定按钮。
- [x] 六爻各起卦方式的动态卡片保持可用。
- [x] 页面长内容不被固定按钮遮挡。

**Verification:**
- [x] 各页面关键按钮和弹层可打开。

**Dependencies:** Task 1

## Task 4: 全量验证与审查

**Acceptance criteria:**
- [x] 类型检查、Lint、生产构建完成。
- [x] 320px 与 536px 无横向溢出。
- [x] 无新增依赖、接口或业务数据结构。

**Verification:**
- [x] `git diff --check`
- [x] `pnpm typecheck`
- [x] `pnpm lint`
- [x] `pnpm build:frontend`

**Dependencies:** Tasks 1–3

---

# 盘局记录身份与本机存储改进

## Task 1: 版本化记录身份契约

**Acceptance criteria:**
- [x] 八字/紫微、奇门/大六壬、六爻分别生成符合领域规则的稳定 `recordKey`。
- [x] 等价历法和地点表示归一；姓名、真太阳时及事件时间边界正确。
- [x] TypeScript 与 Python 对同一固定输入生成相同身份。

**Verification:**
- [x] 前端身份固定向量测试通过。
- [x] 后端身份固定向量测试通过。

**Dependencies:** None

**Files likely touched:** `frontend/src/lib/records/`, `frontend/tests/`, `backend/app/services/record_identity.py`, `backend/tests/`。

## Task 2: 加法数据库契约

**Acceptance criteria:**
- [x] BaziProfile 与 DivinationRecord 增加可选身份、计算版本、生命周期和删除字段。
- [x] 新索引在旧数据存在时可重复执行，不直接强制非空。
- [x] Pydantic 请求/响应字段保持旧客户端兼容。

**Verification:**
- [x] 迁移 SQL 静态检查通过。
- [x] Schema 与响应模型测试通过。

**Dependencies:** Task 1

**Files likely touched:** `backend/prisma/schema.prisma`, `backend/prisma/migrations/`, `backend/app/schemas/bazi.py`, `backend/app/schemas/divination_records.py`。

## Task 3: 八字稳定同步生命周期

**Acceptance criteria:**
- [x] 不同 `localId`、相同 `recordKey` 只产生一个八字云端记录。
- [x] 旧计算版本和旧生命周期不能覆盖新记录或删除。
- [x] 删除后明确重新提交可以创建新生命周期。

**Verification:**
- [x] 八字同步成功、重复、冲突、删除、重新创建测试通过。

**Dependencies:** Tasks 1–2

**Files likely touched:** `backend/app/services/bazi.py`, `backend/app/api/routes/sync_bazi.py`, `backend/app/api/routes/bazi.py`, `backend/tests/test_sync_routes.py`。

## Task 4: 其他占术稳定同步生命周期

**Acceptance criteria:**
- [x] 四类占术按 `userId + type + recordKey` Upsert。
- [x] 六爻分别完成的起卦不误合并。
- [x] 删除、版本冲突和重新创建语义与八字一致。

**Verification:**
- [x] 四类占术同步、权限、冲突和删除测试通过。

**Dependencies:** Tasks 1–2

**Files likely touched:** `backend/app/services/divination_records.py`, `backend/app/api/routes/sync_divination.py`, `backend/tests/test_sync_routes.py`。

## Task 5: IndexedDB 记录模块

**Acceptance criteria:**
- [x] 模块 interface 覆盖列出、读取、Upsert、删除、同步状态和缓存策略。
- [x] IndexedDB 按账号、游客、待认领空间隔离；测试使用内存 adapter。
- [x] 旧全局记录先复制校验到待认领空间，不自动归属账号。

**Verification:**
- [x] 账号隔离、迁移中断恢复、容量策略测试通过。

**Dependencies:** Task 1

**Files likely touched:** `frontend/src/lib/records/`, `frontend/tests/`。

## Task 6: 八字前端接入

**Acceptance criteria:**
- [x] 相同身份重新提交更新原记录并保持最早创建时间。
- [x] 保存成功后立即尝试同步，失败保留待同步状态。
- [x] 不再使用全局八字记录键或 80 条静默截断。

**Verification:**
- [x] 双设备相同八字、不同输入、离线重试测试通过。

**Dependencies:** Tasks 3、5

**Files likely touched:** `frontend/src/lib/bazi/local-records.ts`, `frontend/src/components/bazi/bazi-home-client.tsx`, `frontend/tests/`。

## Task 7: 其他占术前端接入

**Acceptance criteria:**
- [x] 四类占术通过新记录模块保存和同步。
- [x] 打开已有记录严格只读，不改变时间、状态或排序。
- [x] 六爻起卦事件身份与其他时占身份正确区分。

**Verification:**
- [x] 四类结果页浏览零业务记录写入回归测试通过。

**Dependencies:** Tasks 4–5

**Files likely touched:** `frontend/src/lib/divination/local-records.ts`, 四类结果客户端，`frontend/tests/`。

## Task 8: 记录页与账号迁移 UI

**Acceptance criteria:**
- [x] 列表按 `updatedAt` 排序并按稳定身份合并。
- [x] 云端失败展示最后缓存和明确错误状态。
- [x] 游客/待认领导入、普通退出隐藏和清除此设备数据具有明确交互。

**Verification:**
- [x] 登录、退出、换号、断网和移动端静态/浏览器流程通过。

**Dependencies:** Tasks 5–7

**Files likely touched:** `frontend/src/app/records/page.tsx`, 设置登录组件、记录反馈组件及测试。

## Task 9: 历史合并与完整回归

**Acceptance criteria:**
- [x] 历史合并支持只读预览、备份、幂等执行和回滚映射。
- [x] 相同身份保留最早创建时间、最新内容和更新时间。
- [x] 全部领域边界与安全回归测试覆盖。

**Verification:**
- [x] `pnpm typecheck`
- [x] `pnpm lint`（通过，保留仓库既有 warning）
- [x] `pnpm build:frontend`
- [x] `cd backend && .venv/bin/python -m unittest discover -s tests -p 'test_*.py'`
- [x] `git diff --check`

**Dependencies:** Tasks 1–8

**Files likely touched:** 新迁移/维护脚本、测试和相关文档。

---

# 四模块 AI 解读分层浏览

## Task 1: 分层输出协议测试

**Acceptance criteria:**
- [x] 奇门、紫微、六爻和八字均校验“快速浏览＋完整依据”两层结构。
- [x] 测试覆盖禁用 Markdown 表格、禁用 HTML 折叠、取消最低篇幅和避免重复结论。
- [x] 各模块原有事实边界与高风险事项规则继续被覆盖。

**Verification:**
- [x] 旧提示词在新协议测试下出现预期失败。

**Files likely touched:** `frontend/tests/*-ai-command.test.mjs`

## Task 2: 奇门与紫微适配

**Acceptance criteria:**
- [x] 奇门快速浏览聚焦日干、时干、年命宫和事项宫。
- [x] 紫微快速浏览聚焦命身主轴、专项宫位、大限和时间线索。
- [x] 完整依据保留证据、反向证据、限制与风险边界。

**Verification:**
- [x] 奇门与紫微提示词协议测试通过。

**Files likely touched:** `frontend/src/lib/ai/qimen-command.ts`、`frontend/src/lib/ai/ziwei-command.ts`

## Task 3: 六爻与八字适配

**Acceptance criteria:**
- [x] 六爻快速浏览聚焦结论、用神动变链、应期和行动建议。
- [x] 八字快速浏览聚焦命局主轴、喜忌、运势节奏和行动建议。
- [x] 完整依据保留取用、旺衰、运限与风险，不重复快速浏览原文。

**Verification:**
- [x] 六爻与八字提示词协议测试通过。

**Files likely touched:** `frontend/src/lib/ai/liuyao-command.ts`、`frontend/src/lib/ai/bazi-command.ts`

## Task 4: 全量验证

**Acceptance criteria:**
- [x] 相关测试、类型检查、Lint、生产构建和差异检查通过。
- [x] 用户已有无关修改保持不变。

**Verification:**
- [x] `pnpm typecheck`
- [x] `pnpm lint`
- [x] `pnpm build:frontend`
- [x] `git diff --check`

**Dependencies:** Tasks 1–3
