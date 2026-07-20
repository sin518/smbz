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
