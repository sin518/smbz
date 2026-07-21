# Issue Tracker（问题追踪器）

本仓库使用 **GitHub Issues** 作为问题追踪器。

## 工作流程

- 创建问题：`gh issue create --title "..." --body "..."`
- 列出问题：`gh issue list --label <label>`
- 更新标签：`gh issue edit <number> --add-label <label> --remove-label <label>`
- 关闭问题：`gh issue close <number> --comment "..."`

## PRs 作为请求来源

**已禁用。** 外部提交的 Pull Request 不会在分类工作流中被视为问题。只有实际的 GitHub Issues 会被处理。

## 读取问题

读取问题的 skills（`/triage`、`/to-spec`、`/qa`）使用 `gh issue list` 和 `gh issue view`。所有问题状态都存储在 GitHub 中。
