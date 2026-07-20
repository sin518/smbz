# Spec: 八字四柱干支选择

## Objective

在八字出生时间弹窗中提供“公历 / 农历”两个等宽入口。“农历”入口按用户约定承载四柱干支反查：用户从传统六十甲子中选择年柱、月柱、日柱、时柱，系统复用 `taibu-core/bazi-pillars-resolve` 反查 1900–2100 年内的候选出生时间，并由用户确认候选后进入现有八字排盘链路。

## Tech Stack

- Next.js App Router、React、TypeScript、Tailwind CSS
- React Hook Form、Zod
- 本地工作区包 `taibu-core/bazi-pillars-resolve`

## Commands

```bash
pnpm typecheck
pnpm lint
pnpm build:frontend
node --test frontend/packages/core/tests/bazi-enhancements.test.mjs
```

## Project Structure

- `frontend/src/components/shared/divination-profile-card.tsx`：公共公历时间选择器，不承载八字专用四柱逻辑。
- `frontend/src/components/bazi/`：八字四柱选择、候选确认和页面编排。
- `frontend/src/lib/bazi/`：六十甲子及候选转换等无 UI 逻辑。
- `frontend/packages/core/src/domains/bazi-pillars-resolve/`：既有确定性反查算法，直接复用。

## Code Style

```ts
const sexagenaryCycle = Array.from({ length: 60 }, (_, index) =>
  `${heavenlyStems[index % 10]}${earthlyBranches[index % 12]}`
);
```

- 保持 TypeScript strict，不新增 `any` 或 `@ts-ignore`。
- 公共时间选择器保持通用；八字专属逻辑放在八字组件目录。
- 只在用户点击确认时运行反查，避免滚动期间重复计算。

## Testing Strategy

- 单元测试验证传统六十甲子的数量、顺序和非法组合缺失。
- 复用 core 既有测试验证候选四柱可往返一致。
- 类型检查和构建覆盖组件接线。
- 手工验证 430px 移动端弹窗、公历模式、四柱模式、空候选和多候选状态。

## Boundaries

- Always：复用 `resolveBaziPillars`；多候选必须由用户选择；无候选必须显示错误。
- Ask first：改变反查年份范围、数据库结构或持久化模型。
- Never：从四柱静默猜测唯一时间；复制一套排盘算法；直接修改线上数据。

## Success Criteria

- 顶部“公历 / 农历”各占一半，可通过键盘切换。
- 农历模式显示年、月、日、时四柱，每列按传统六十甲子排列。
- 单候选直接采用，多候选要求选择，无候选阻止确认并显示提示。
- 选定候选后可以沿现有流程完成排盘，记录保存 `calendar: "pillars"` 和明确出生时间。
- 相关测试、类型检查通过；不能执行的检查明确说明。

## Open Questions

- 无。界面标签按用户要求显示“农历”，并以说明文字明确其功能是“四柱干支反查出生时间”。
