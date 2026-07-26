# Implementation Plan: 八字四柱干支选择

## Overview

复用现有四柱反查算法，为八字页增加可维护、可访问的四柱选择与候选确认流程，同时保持公共公历选择器不受影响。

## Architecture Decisions

- 八字专属弹窗组合公共公历选择器与四柱选择器，避免把业务逻辑泄漏进共享组件。
- 六十甲子生成与候选转换放入 `frontend/src/lib/bazi/`，便于单测和复用。
- 反查结果必须先转换为明确公历时间，现有排盘函数继续作为唯一排盘入口。

## Task List

### Phase 1: Foundation

- [x] Task 1：增加六十甲子生成和候选时间转换工具及测试。

### Checkpoint: Foundation

- [x] 六十甲子顺序测试和 core 四柱反查测试通过。

### Phase 2: Core Feature

- [x] Task 2：增加八字专属“公历 / 农历”时间选择弹窗和四柱选择器。
- [x] Task 3：接入候选反查、单候选和多候选确认状态。
- [x] Task 4：接入表单提交、记录保存和现有排盘流程。

### Checkpoint: Core Feature

- [x] 公历流程无回归，四柱流程可完成排盘。

### Phase 3: Verification

- [x] Task 5：运行单测、类型检查、Lint、构建并手工检查移动端（Lint 脚本兼容性问题已记录）。

### Checkpoint: Complete

- [x] 所有必要验收条件满足，未留下临时调试代码。

## Risks and Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| 反查遍历 1900–2100 年导致等待 | 中 | 只在确认时执行，并显示忙碌状态 |
| 同一四柱存在多个候选 | 高 | 强制用户选择，不默认猜测 |
| 公历公共组件被八字逻辑污染 | 中 | 新建八字专属组合组件，公共组件保持原接口 |
| 四柱记录缺少明确出生时间 | 高 | 保存用户确认的候选时间，同时保留 `calendar: "pillars"` |

## Open Questions

- 无。

---

# Implementation Plan: 全局点击式六十甲子时间选择

## Overview

把六爻现有干支选择改造成共享的点击式四柱时间选择能力，并接入八字、紫微、奇门和大六壬。传统六十甲子按六旬分组展示，桌面端和手机端采用同一套点击交互。

## Architecture Decisions

- 使用甲子旬、甲戌旬、甲申旬、甲午旬、甲辰旬、甲寅旬六组，每组恰好 10 个合法干支。
- 六十甲子数据、四柱面板和候选确认归入共享组件，页面只负责保存最终选择结果。
- 四柱必须反查成明确公历时间后才能提交；无候选报错，多候选由用户确认，禁止静默回退。
- 页签切换仅修改弹窗草稿，取消时不污染外部表单。

## Task List

### Phase 1: Foundation

- [x] Task 1：增加六旬分组工具、合法性校验和单元测试。
- [x] Task 2：提取共享点击式四柱面板及候选确认流程。

### Checkpoint: Foundation

- [x] 六旬共 60 项、无无效组合，候选反查测试通过。

### Phase 2: Adoption

- [x] Task 3：替换六爻和八字现有干支选择实现。
- [x] Task 4：接入紫微、奇门和大六壬时间选择弹窗。

### Checkpoint: Adoption

- [x] 五个页面均可从四柱选择得到明确时间，原公历流程不回归。

### Phase 3: Verification

- [x] Task 5：运行测试、类型检查、构建并手工验证手机端。
- [x] Task 6：按 correctness、architecture、accessibility、performance 做最终审查。

### Checkpoint: Complete

- [x] 所有必要验收条件满足，未留下临时调试代码。

## Risks and Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| 同一四柱对应多个年份 | 高 | 显示候选列表，不自动猜测 |
| 浏览器同步遍历造成卡顿 | 高 | 复用 core 反查入口，只在确认时执行并显示加载状态 |
| 不同页面表单模型不一致 | 中 | 共享组件统一返回明确时间，页面仅保留必要模式字段 |
| 小屏选项过密 | 中 | 六旬分组、固定点击目标和内部滚动区域 |

---

# Implementation Plan: 排盘录入页视觉统一

## Overview

把已验证的八字录入页视觉语言同步到六爻、紫微资料、奇门和大六壬录入页，统一标题区、分组卡片和底部操作区，同时保持各模块表单、弹层和排盘逻辑不变。

## Architecture Decisions

- 抽取录入页外壳、分组标题、卡片样式和底部操作区为共享展示组件，页面继续拥有各自业务状态。
- 模块徽章沿用首页的红、紫、金、棕色区分，排版、间距和交互层级保持一致。
- 紫微保留当前未提交的地点选择器改动，只在现有实现上增量调整样式。
- 只修改录入页，不延伸到首页、结果页、记录页或设置页。

## Task List

### Phase 1: Shared Visual Foundation

- [x] Task 1：抽取并让八字页复用统一录入页视觉组件。

### Checkpoint: Foundation

- [x] 八字页视觉与交互无回归，类型检查通过。

### Phase 2: Module Adoption

- [x] Task 2：同步紫微资料和大六壬录入页。
- [x] Task 3：同步奇门和六爻录入页。

### Checkpoint: Adoption

- [x] 四个页面功能保持不变，320px 和 536px 无横向溢出。

### Phase 3: Verification

- [x] Task 4：运行类型检查、Lint、生产构建和浏览器交互验证。
- [x] Task 5：按正确性、架构、可访问性和回归风险完成审查。

### Checkpoint: Complete

- [x] 所有录入页视觉统一，无必须修复项。

## Risks and Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| 紫微存在未提交功能修改 | 高 | 仅增量应用样式，不恢复或覆盖地点选择器改动 |
| 共享样式影响非目标页面 | 中 | 新组件仅由目标录入页显式接入，原共享表单默认行为不变 |
| 六爻页面较长、固定按钮遮挡内容 | 中 | 内容区增加安全间距，并在小屏滚动验证 |
| 模块表单结构差异导致强行统一 | 中 | 统一视觉骨架，不统一业务字段或状态模型 |

## Open Questions

- 无，范围已确认。

---

# Implementation Plan: 盘局记录身份与本机存储改进

## Overview

落实 ADR 0003 与 ADR 0004：为五类盘局建立跨设备稳定身份和统一生命周期，把未隔离的 `localStorage` 记录迁移到账号隔离的 IndexedDB，并修复重复记录、浏览写入、静默截断、删除复活及云端错误被吞等问题。实施采用加法兼容和分阶段切换，不直接修改线上数据库。

## Architecture Decisions

- 记录模块提供小型 interface，隐藏身份规范化、IndexedDB、迁移、缓存和同步状态；生产使用 IndexedDB adapter，测试使用内存 adapter。
- `recordKey` 表示业务身份，`localId` 表示设备写入；后端重新计算或校验身份，并以用户、占术类型和 `recordKey` 保证唯一。
- Schema 和请求字段先以可选字段加入，兼容旧客户端；完成回填和合并后再收紧约束。
- 删除使用生命周期版本和删除状态，旧离线写入不能覆盖删除；删除后的明确重新提交开始新生命周期。
- 浏览已有记录是严格只读，只有明确提交才能更新内容及 `updatedAt`。

## Dependency Graph

```text
身份规范化契约
    ├── 后端加法 Schema/迁移
    │       ├── 八字同步生命周期
    │       └── 其他占术同步生命周期
    └── 本机记录模块
            ├── 八字接入
            ├── 其他占术接入
            └── 记录页与账号迁移 UI
                    └── 历史数据合并与完整回归
```

## Task List

### Phase 1: Contract and Backend Foundation

- [x] Task 1：定义五类占术的版本化记录身份契约与跨语言固定测试向量。
- [x] Task 2：增加兼容旧客户端的数据库字段、索引和迁移文件。
- [x] Task 3：让八字同步按稳定身份 Upsert，并实现版本冲突与删除防复活。
- [x] Task 4：让六爻、奇门、紫微和大六壬同步复用同一生命周期语义。

### Checkpoint: Backend Contract

- [x] 两个不同 `localId` 的相同记录返回同一 `serverId`。
- [x] 不同用户永不合并；旧客户端请求仍可同步。
- [x] 后端成功、权限、冲突、删除和重新创建测试通过。

### Phase 2: Local Record Module

- [x] Task 5：实现账号隔离的 IndexedDB 记录模块、内存 adapter 和旧 `localStorage` 待认领迁移。
- [x] Task 6：八字保存、读取、立即同步和删除切换到新记录模块。
- [x] Task 7：其他占术切换到新记录模块，并移除结果页打开即保存。
- [x] Task 8：记录页接入摘要/完整内容状态、更新时间排序、云端错误提示、游客认领和退出清理。

### Checkpoint: Frontend Behaviour

- [x] 账号 A、账号 B、游客和待认领空间完全隔离。
- [x] 同一记录跨设备只显示一条，浏览不产生任何业务记录写入。
- [x] 未同步或固定离线记录不会被静默淘汰。

### Phase 3: Migration and Verification

- [x] Task 9：增加历史重复预览/合并流程、完整回归测试和迁移文档。

### Checkpoint: Complete

- [x] 受影响测试、类型检查、Lint、前端构建和后端测试通过。
- [x] 迁移具备备份、预览、幂等、回滚说明，且未直接运行线上变更。
- [x] 没有遗留结果页保存副作用、生产读取全局记录键或 80 条静默截断。

## Risks and Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| 身份规范化错误导致误合并 | 高 | 版本化规则、跨语言固定向量、先预览后合并 |
| 旧本机记录账号归属未知 | 高 | 统一进入待认领空间，用户确认前不展示不上传 |
| 新旧客户端并存造成覆盖 | 高 | 字段加法兼容，服务端版本比较，旧版本不能覆盖新版本或删除 |
| IndexedDB 迁移中断 | 高 | 先复制校验再切换读取，旧键保留一个兼容周期 |
| 删除墓碑持续增长 | 中 | 保留最小身份和生命周期信息，后续按确认策略压缩 |
| 异步存储改造扩大 UI 影响 | 中 | 通过记录模块 interface 集中异步性，按八字和其他占术分批接入 |

## Open Questions

- 无；领域与产品决策已记录在 `CONTEXT.md`、ADR 0003 和 ADR 0004。
