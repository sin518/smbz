# Triage Label Vocabulary（分类标签词汇表）

本仓库使用默认的分类标签词汇表：

| 角色 | 标签字符串 |
|------|-------------|
| 需要维护者评估 | `needs-triage` |
| 等待报告者回复 | `needs-info` |
| 准备好供 Agent 处理 | `ready-for-agent` |
| 准备好供人类实现 | `ready-for-human` |
| 不会处理 | `wontfix` |

## 使用方式

当 `/triage` 处理问题时，会应用这些标签来追踪状态。如果你想更改任何映射，请编辑此文件并更新上表。

## 创建标签

如果这些标签在你的 GitHub 仓库中还不存在，可以通过以下命令创建：

```bash
gh label create needs-triage --description "维护者需要评估"
gh label create needs-info --description "等待报告者回复"
gh label create ready-for-agent --description "完全明确，可供 Agent 自主处理"
gh label create ready-for-human --description "需要人类实现"
gh label create wontfix --description "不会处理"
```
