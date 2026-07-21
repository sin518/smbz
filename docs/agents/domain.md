# Domain Docs（领域文档）

本仓库使用 **单一上下文** 布局：

- 仓库根目录的 `CONTEXT.md` 描述项目的领域语言、核心概念和业务规则
- `docs/adr/` 包含架构决策记录（Architecture Decision Records）

## 消费规则

读取领域上下文的 skills（`/improve-codebase-architecture`、`/diagnosing-bugs`、`/tdd`、`/domain-modeling`）：

1. 首先阅读 `CONTEXT.md` 以理解领域语言
2. 检查 `docs/adr/` 以了解约束当前工作的过往架构决策
3. 提出变更时，引用相关 ADR，并在领域概念变化时更新 `CONTEXT.md`

## CONTEXT.md 格式

推荐的结构参见种子模板：`.claude/skills/engineering/domain-modeling/CONTEXT-FORMAT.md`

## ADR 格式

推荐的结构参见种子模板：`.claude/skills/engineering/domain-modeling/ADR-FORMAT.md`
