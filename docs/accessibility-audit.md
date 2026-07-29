# 全站无障碍审查报告

审查日期：2026-07-29  
审查目标：`https://www.bzsm.lat/`  
基准：WCAG 2.2 A / AA 为发布硬门槛，AAA 仅作增强建议  
结论：**当前版本不满足 WCAG 2.2 AA，暂不建议声明合规。**

## 1. 执行摘要

本轮共确认 13 个可复现问题：

| 严重级别 | 数量 | 定义 |
| --- | ---: | --- |
| P0 | 0 | 危险操作可被直接误触、造成不可逆数据损失 |
| P1 | 4 | 核心流程对残障用户不可完成或实际不可用 |
| P2 | 9 | 明确违反 A/AA，但存在绕行方式 |
| P3 | 0 | 轻微问题或纯 AAA 增强项 |

最优先处理的四项是：

1. 页面禁止缩放，低视力用户无法使用浏览器放大。
2. 日期时间滚轮向读屏暴露数百个无分组按钮，核心排盘输入近乎不可用。
3. 多数弹层没有对话框语义、焦点约束、Escape 关闭和焦点恢复，账号注销确认层也受影响。
4. 八字、紫微和六爻的核心命盘依赖视觉网格，读屏只能得到平铺文字，行列、宫位和对应关系丢失。

PageSpeed Insights 的移动端无障碍得分为 **88**。自动检查仅直接发现了：

- viewport 禁止缩放；
- 首页五个功能标签颜色对比度不足。

这并不代表只有两个问题。自动化工具无法可靠发现弹层焦点、键盘模式、错误播报、复杂命盘关系和真实读屏体验。完整合规结论必须以人工审查为准。

## 2. 范围与方法

### 2.1 覆盖范围

公开页面与流程：

- 首页；
- 八字：资料输入、时间/地点选择、基本盘、信息页、专业细盘；
- 紫微：资料输入与命盘；
- 六爻：首页、报数起卦、摇卦页、结果页；
- 奇门：首页与结果页；
- 大六壬：首页与结果页；
- 排盘记录；
- 设置、登录、隐私政策、用户协议；
- `/bazi/demo/ganzhi`；
- 管理后台全部资源：用户、登录会话、登录方式、命理档案、八字排盘、付款记录。

登录状态：

- 未登录；
- 普通测试账号；
- 管理员测试账号；
- 登录、退出、账号注销确认等边界状态。

显示与输入：

- 412 × 823 移动端；
- 320 × 900 窄视口，作为桌面高倍放大的回流等效检查；
- 1440 × 900 桌面端；
- 浅色、深色、跟随系统；
- 键盘、Safari 辅助功能树与 macOS VoiceOver 抽样；
- 加载、空数据、错误、未登录和弹层状态。

### 2.2 证据来源

- 用户提供的 [PageSpeed Insights 报告](https://pagespeed.web.dev/analysis/https-www-bzsm-lat/ji56jpzwks?form_factor=mobile)；
- 线上生产页面；
- Safari + macOS VoiceOver；
- 浏览器辅助功能树、焦点、计算样式与布局尺寸；
- 本仓库前端源码。

规范参考：

- [WCAG 2.2](https://www.w3.org/TR/WCAG22/)；
- [WAI-ARIA 对话框模式](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/)；
- [WAI-ARIA 标签页模式](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/)。

### 2.3 限制

- 移动端真实 200% / 400% 手势缩放被产品自身的 `maximum-scale=1` 阻止，因此无法完成正常的手势缩放验收；改为使用 320px 等效视口验证页面回流。
- VoiceOver 抽样验证了 Safari 暴露的实际辅助功能树，但未录制语音输出。
- 未穷举所有命理输入组合，也未审查排盘算法正确性。
- 未执行任何账号注销、批量删除、后台写入或 AI 分析请求。

## 3. 详细发现

### A11Y-001 — P1：页面禁止用户缩放

对应标准：

- [1.4.4 Resize Text（AA）](https://www.w3.org/TR/WCAG22/#resize-text)

影响范围：全站。

证据：

- PageSpeed 直接判定 `meta-viewport` 失败。
- `frontend/src/app/layout.tsx:12` 设置全局 viewport。
- `frontend/src/app/layout.tsx:15` 设置 `maximumScale: 1`。

影响：

- 移动端低视力用户无法通过系统或浏览器手势放大内容；
- 已约定的 200% / 400% 放大验收被产品配置本身阻断。

修复建议：

- 删除 `maximumScale: 1`；
- 不设置 `user-scalable=no`；
- 修复后在 iOS Safari 与 Android Chrome 实测 200% 和 400% 放大、固定导航遮挡、弹层滚动及表单输入。

验收标准：

- 用户可以正常双指缩放；
- 200% / 400% 下核心流程仍可完成；
- 不出现内容裁切、固定层遮挡或二维滚动，确需二维布局的命盘/表格除外。

### A11Y-002 — P1：日期时间滚轮向读屏暴露数百个按钮

对应标准：

- [1.3.1 Info and Relationships（A）](https://www.w3.org/TR/WCAG22/#info-and-relationships)
- [2.1.1 Keyboard（A）](https://www.w3.org/TR/WCAG22/#keyboard)
- [4.1.2 Name, Role, Value（A）](https://www.w3.org/TR/WCAG22/#name-role-value)

影响范围：

- 八字出生时间；
- 紫微出生时间；
- 六爻起卦时间；
- 奇门起局时间；
- 大六壬起课时间；
- 复用 `PickerColumn` 的其他入口。

证据：

- `frontend/src/components/shared/divination-profile-card.tsx:449` 使用五列视觉滚轮；
- `frontend/src/components/shared/divination-profile-card.tsx:520` 定义 `PickerColumn`；
- `frontend/src/components/shared/divination-profile-card.tsx:593` 把每个候选值渲染成独立按钮；
- Safari + VoiceOver 打开八字出生时间后，辅助功能树依次暴露：
  - 1920–2050 共 131 个年份按钮；
  - 12 个月按钮；
  - 最多 31 个日期按钮；
  - 24 个小时按钮；
  - 60 个分钟按钮；
  - 背景页面控件仍同时存在。
- 当前值没有适合滚轮的 `listbox` / `option`、`spinbutton` 或原生日期时间语义，也没有向读屏明确暴露选中状态。

影响：

- 键盘和读屏用户需要穿过数百个控件才能完成一次核心输入；
- 同名的 `01`、`02` 等按钮无法判断属于月、日、时还是分；
- 当前选中值和五列关系不可理解。

修复建议：

- 优先采用浏览器可访问的原生日期/时间输入，并提供可靠的文本输入回退；
- 如保留自定义滚轮，每列实现独立的命名 `spinbutton`，通过增减动作改变值；
- 或按 ARIA `listbox` / `option` 模式实现，每列有可访问名称、唯一当前项、正确 `aria-selected`、受控焦点和 Home/End/方向键；
- 非当前或视口外候选值不要全部进入 Tab 顺序；
- 五列必须分别命名为年、月、日、时、分。

验收标准：

- VoiceOver 可以在不遍历数百个按钮的情况下设置完整时间；
- 每一列、当前值和允许操作都能被读出；
- 键盘可在合理按键数内完成输入。

### A11Y-003 — P1：弹层缺少完整的对话框与焦点管理

对应标准：

- [2.1.1 Keyboard（A）](https://www.w3.org/TR/WCAG22/#keyboard)
- [2.4.3 Focus Order（A）](https://www.w3.org/TR/WCAG22/#focus-order)
- [2.4.11 Focus Not Obscured (Minimum)（AA）](https://www.w3.org/TR/WCAG22/#focus-not-obscured-minimum)
- [4.1.2 Name, Role, Value（A）](https://www.w3.org/TR/WCAG22/#name-role-value)

影响范围：

- 通用档案选择；
- 出生时间和地点选择；
- 六爻方式、时间、爻位等选择层；
- 账号资料编辑；
- 账号注销确认；
- 大六壬 AI 指令层；
- 八字、紫微、奇门 AI 指令弹窗的焦点行为。

源码例：

- `frontend/src/components/shared/divination-profile-card.tsx:205`
- `frontend/src/components/shared/divination-profile-card.tsx:430`
- `frontend/src/components/bazi/bazi-birth-time-picker-sheet.tsx:165`
- `frontend/src/components/bazi/bazi-location-picker-sheet.tsx:78`
- `frontend/src/components/liuyao/liuyao-home-client.tsx:574`
- `frontend/src/components/liuyao/liuyao-home-client.tsx:812`
- `frontend/src/components/settings/login-client.tsx:736`
- `frontend/src/components/settings/login-client.tsx:891`

实际复现：

1. 八字点击“选择出生时间”：
   - `role="dialog"` 数量为 0；
   - `aria-modal="true"` 数量为 0；
   - 焦点仍停在触发按钮；
   - 背景有 8 个可聚焦控件；
   - `body` 仍可滚动；
   - Escape 不关闭。
2. 普通账号打开“修改昵称”：
   - 输入框会自动聚焦，这是正向行为；
   - 但容器没有对话框语义，背景仍有 11 个可聚焦控件；
   - Escape 不关闭。
3. 打开“确认注销账号？”：
   - 焦点仍停在背景“账号注销”按钮；
   - 没有 `dialog` / `aria-modal`；
   - 页面背景仍可操作。
4. 奇门 AI 指令弹窗虽然有 `role="dialog"` 和 `aria-modal`：
   - 打开后焦点落在 `body`，没有进入弹窗；
   - Escape 不关闭；
   - 关闭后焦点落到 `body`，没有回到“AI指令”按钮；
   - 背景滚动未锁定。

影响：

- 读屏用户不知道上下文已切换；
- 键盘用户可能进入背景，无法确定当前位置；
- 对账号注销这类破坏性流程，错误焦点会显著增加误操作风险。

修复建议：

- 统一使用一个经过验证的 Modal / Dialog 基础组件；
- 打开时聚焦标题、首个输入或最安全的操作；
- Tab / Shift+Tab 约束在弹层内；
- Escape 关闭；
- 关闭后恢复到原触发控件；
- 背景使用 `inert`，并锁定页面滚动；
- 容器使用 `role="dialog"`、`aria-modal="true"` 和 `aria-labelledby`；
- 破坏性确认默认聚焦“取消”，不要聚焦“确认注销”。

### A11Y-004 — P1：核心命盘的信息关系没有程序化表达

对应标准：

- [1.3.1 Info and Relationships（A）](https://www.w3.org/TR/WCAG22/#info-and-relationships)
- [1.3.2 Meaningful Sequence（A）](https://www.w3.org/TR/WCAG22/#meaningful-sequence)

影响范围：

- 八字基本盘与专业细盘；
- 紫微十二宫命盘；
- 六爻主卦/变卦六爻表。

源码证据：

- 八字使用 CSS Grid 的普通 `div`：
  - `frontend/src/components/bazi/bazi-chart-view.tsx:97`
  - `frontend/src/components/bazi/bazi-chart-view.tsx:98`
  - `frontend/src/components/bazi/professional-detail.tsx:93`
  - `frontend/src/components/bazi/professional-detail.tsx:94`
- 紫微宫位使用视觉网格：
  - `frontend/src/components/ziwei/ziwei-chart-client.tsx:102`
  - `frontend/src/components/ziwei/ziwei-chart-client.tsx:114`
- 六爻每爻使用普通网格行：
  - `frontend/src/components/liuyao/liuyao-result-client.tsx:262`

线上与 Safari 观察：

- 八字结果只暴露一个“排盘”区域和连续文本，年/月/日/时列与天干、地支、十神等行的交叉关系丢失；
- 紫微结果没有命名 `region` / `group` / 表格结构，方位、宫位与星曜被读成一个很长的平铺序列；
- 六爻结果没有表格或分组语义，六神、主卦、变卦和每一爻的关系无法确定。

正向对照：

- 奇门每个宫位使用命名 `region`，例如“巽4宫”；
- 大六壬使用命名 `group`、`dl` 和列表；
- 这两个结果页的读屏结构明显优于八字、紫微和六爻。

修复建议：

- 八字和六爻优先使用语义化 `<table>`，配置 `<caption>`、行/列 `<th scope>`；
- 紫微每个宫位至少使用命名 `section` / `region`，名称包含宫位、地支和方位；
- 每个宫内以 `dl` 或结构化列表表达“字段—值”；
- 为复杂图形提供一个等价的“读屏文本模式”，但不能用不完整摘要替代全部核心数据；
- 视觉顺序与 DOM 阅读顺序保持一致。

### A11Y-005 — P2：浅色和深色主题存在大面积文本对比度不足

对应标准：

- [1.4.3 Contrast (Minimum)（AA）](https://www.w3.org/TR/WCAG22/#contrast-minimum)

影响范围：几乎所有公开页面及结果页。

代表性证据：

- PageSpeed 首页五个标签 `#9a7a39` / `#fbf4e4`：约 **3.67:1**；
- 表单副标题 `#a28e66` / `#F8F7EE`：约 **2.96:1**；
- 表单说明 `#9a9388` / `#fffdf7`：约 **2.99:1**；
- 未选分段项 `#8b8985` / `#f2f2f0`：约 **3.11:1**；
- 设置页未选主题文字：约 **2.46:1**；
- 记录页选中筛选白字 / `#b88b2d`：约 **3.10:1**；
- 深色法律页正文：约 **3.16:1**；
- 八字五行颜色最低约 **2.78:1**；
- 紫微大量 6–10px 文字约 **3.45–3.82:1**；
- 六爻结果表头/说明约 **3.49–3.59:1**。

相关设计令牌：

- `frontend/src/app/globals.css:5`
- `frontend/src/app/globals.css:7`
- `frontend/src/app/globals.css:17`
- `frontend/src/app/globals.css:20`
- `frontend/src/app/globals.css:29`
- `frontend/src/app/globals.css:67`

影响：

- 普通正文需至少 4.5:1；许多文本远低于阈值；
- 命盘中的极小字号会进一步放大可读性问题；
- 深色主题的全局类名重写使原本安全的颜色组合也可能失效。

修复建议：

- 建立按用途命名的语义色令牌：正文、次要正文、占位符、选中态、禁用态、结果五行色；
- 每个令牌同时定义浅色和深色组合，并自动计算对比度；
- 结果图使用“颜色 + 文字/形状”表达，不只依赖颜色；
- 将 6–10px 的关键信息增大，不把极小字号当作对比度补偿；
- CI 中增加 axe 或 Lighthouse 对比度检查，并给令牌增加单元测试。

### A11Y-006 — P2：多个表单控件未与可见标签建立关联

对应标准：

- [1.3.1 Info and Relationships（A）](https://www.w3.org/TR/WCAG22/#info-and-relationships)
- [2.5.3 Label in Name（A）](https://www.w3.org/TR/WCAG22/#label-in-name)
- [3.3.2 Labels or Instructions（A）](https://www.w3.org/TR/WCAG22/#labels-or-instructions)

影响范围：

- 八字/紫微姓名；
- 六爻求测问题；
- 大六壬出生年份；
- 排盘记录搜索框；
- 复用 `SharedFieldRow` 的其他原生输入。

证据：

- `SharedFieldRow` 的 `<label>` 没有 `htmlFor`，输入也没有匹配 `id`：
  - `frontend/src/components/shared/divination-profile-card.tsx:289`
  - `frontend/src/components/shared/divination-profile-card.tsx:305`
- 姓名输入只有占位符：
  - `frontend/src/components/shared/divination-profile-card.tsx:66`
  - `frontend/src/components/shared/divination-profile-card.tsx:68`
- 六爻问题输入只有占位符：
  - `frontend/src/components/liuyao/liuyao-home-client.tsx:339`
- 大六壬出生年份没有 `aria-label` 或关联标签：
  - `frontend/src/components/daliuren/daliuren-home-client.tsx:124`
- 记录搜索框被视觉 `<label>` 包裹，但 Safari/Chromium 辅助功能树仍显示为无名称 `searchbox`：
  - `frontend/src/app/records/page.tsx:405`

Safari + VoiceOver：

- 可见标签是“姓名”，但文本框被读成“请输入姓名”，即占位符代替了标签；
- 标签在输入后消失或用户开始输入后，控件用途更难确认。

修复建议：

- 所有原生输入使用稳定 `id` 和 `<label htmlFor>`；
- 可见标签文字应包含在可访问名称中；
- 占位符只作格式示例，不作标签；
- 复用组件接收 `controlId`，并自动关联标签、说明和错误；
- 记录搜索框增加明确的“搜索排盘记录”标签或 `aria-label`。

### A11Y-007 — P2：表单错误和异步状态未可靠关联或播报

对应标准：

- [3.3.1 Error Identification（A）](https://www.w3.org/TR/WCAG22/#error-identification)
- [3.3.3 Error Suggestion（AA）](https://www.w3.org/TR/WCAG22/#error-suggestion)
- [4.1.3 Status Messages（AA）](https://www.w3.org/TR/WCAG22/#status-messages)

影响范围：

- 八字、紫微、六爻、奇门、大六壬表单；
- 登录/自动注册；
- 登录协议提醒；
- AI 复制和分析状态；
- 云端记录加载/同步状态。

证据：

- 全站主要业务表单没有使用 `aria-invalid`、`aria-describedby` 或 `aria-errormessage`；
- `SharedFieldRow` 错误只是普通 `<p>`：
  - `frontend/src/components/shared/divination-profile-card.tsx:311`
- 奇门问题错误只是普通 `<p>`：
  - `frontend/src/components/qimen/qimen-home-client.tsx:132`
- 登录错误只是普通 `<p>`：
  - `frontend/src/components/settings/login-client.tsx:407`
- 登录状态通过 `setMessage` 改变，但容器不是 live region：
  - `frontend/src/components/settings/login-client.tsx:141`
  - `frontend/src/components/settings/login-client.tsx:266`

实际复现：

- 八字空表单提交后出现“请选择出生时间”，但：
  - 焦点落到 `body`；
  - `aria-invalid` 数量为 0；
  - 没有错误描述关联；
  - 没有 alert/live region。
- 奇门缺少出生年时会把焦点移到出生年，这是正向行为，但错误文字仍未与输入关联。

修复建议：

- 失败控件设置 `aria-invalid="true"`；
- 错误元素使用稳定 ID，并通过 `aria-describedby` / `aria-errormessage` 关联；
- 提交失败后聚焦第一个错误控件，并提供顶部错误摘要；
- 登录、上传、复制、分析等非焦点状态使用适当的 `role="status"` / `aria-live="polite"`；
- 阻止提交或危险失败使用 `role="alert"`，避免重复播报。

### A11Y-008 — P2：部分输入控件没有可见焦点指示

对应标准：

- [2.4.7 Focus Visible（AA）](https://www.w3.org/TR/WCAG22/#focus-visible)

影响范围：

- 姓名输入；
- 六爻问题；
- 奇门和大六壬文本域/出生年份；
- 登录页输入；
- 记录搜索；
- 资料编辑输入；
- AI 指令文本域。

证据：

- 多个控件使用 `outline-none`，没有 `focus-visible` 替代：
  - `frontend/src/components/shared/divination-profile-card.tsx:70`
  - `frontend/src/components/liuyao/liuyao-home-client.tsx:342`
  - `frontend/src/components/qimen/qimen-home-client.tsx:129`
  - `frontend/src/components/daliuren/daliuren-home-client.tsx:103`
  - `frontend/src/components/settings/login-client.tsx:384`
  - `frontend/src/app/records/page.tsx:412`
- 实测八字姓名输入聚焦时：
  - outline 为透明 2px；
  - 无 box-shadow；
  - 无边框；
  - 背景透明；
  - 视觉上无法识别当前焦点。

修复建议：

- 统一为所有交互控件提供 `:focus-visible` 样式；
- 至少使用 2px 高对比轮廓，并保留 offset；
- 不要只通过轻微边框变色表达焦点；
- 在浅色、深色、结果页和弹层背景上分别验证。

### A11Y-009 — P2：自定义标签页不支持标准键盘模式

对应标准：

- [2.1.1 Keyboard（A）](https://www.w3.org/TR/WCAG22/#keyboard)
- [4.1.2 Name, Role, Value（A）](https://www.w3.org/TR/WCAG22/#name-role-value)

影响范围：

- 公历/农历切换；
- 干支年柱/月柱/日柱/时柱切换；
- 地点省/市/区步骤；
- 其他使用 `role="tab"` 的选择器。

证据：

- `frontend/src/components/shared/ganzhi-pillar-selector.tsx:33`
- `frontend/src/components/bazi/bazi-birth-time-picker-sheet.tsx:72`
- `frontend/src/components/bazi/bazi-location-picker-sheet.tsx:96`
- 组件设置了 `role="tab"` 和 `aria-selected`，但没有：
  - roving `tabIndex`；
  - ArrowLeft / ArrowRight / Home / End；
  - `aria-controls`；
  - 对应 `tabpanel`。
- 实测在“公历”上按 ArrowRight，仍停留在“公历”；两个 tab 都进入普通 Tab 顺序。

修复建议：

- 若本质只是二选一或步骤按钮，移除 tab 角色，改用 `button` + `aria-pressed`；
- 若保留 tabs，完整实现 WAI-ARIA Tabs Pattern。

### A11Y-010 — P2：页面标题不区分路由，后台还缺少正确主标题/地标

对应标准：

- [2.4.2 Page Titled（A）](https://www.w3.org/TR/WCAG22/#page-titled)
- [2.4.6 Headings and Labels（AA）](https://www.w3.org/TR/WCAG22/#headings-and-labels)
- [1.3.1 Info and Relationships（A）](https://www.w3.org/TR/WCAG22/#info-and-relationships)

影响范围：全站，后台尤其明显。

证据：

- 只有根布局定义 metadata：
  - `frontend/src/app/layout.tsx:7`
  - `frontend/src/app/layout.tsx:8`
- 实测首页、八字、紫微、六爻、奇门、大六壬、记录、设置、法律页和结果页的标题都为“赛博八字”。
- 后台资源列表只有视觉标题对应的 `h6`，没有 `h1`；
- 后台退出后 `/admin#/login` 没有 `main`、没有任何 heading，表单控件和按钮均为英文。

影响：

- 读屏、浏览器标签、历史记录和任务切换器无法区分页面；
- 后台用户无法通过标题快捷键定位主内容。

修复建议：

- 为每个路由或路由布局配置唯一、描述性的 metadata；
- 示例：`八字排盘｜赛博八字`、`排盘记录｜赛博八字`；
- 管理后台至少提供一个 `h1`，并确保登录页有 `main` 和页面标题；
- 后台可访问名称与界面语言统一为中文，或为外语片段标注 `lang`。

### A11Y-011 — P2：持续动画无法暂停，也未完整响应减少动态效果

对应标准：

- [2.2.2 Pause, Stop, Hide（A）](https://www.w3.org/TR/WCAG22/#pause-stop-hide)

影响范围：六爻摇卦页，登录协议抖动等交互动效为次要影响。

证据：

- `frontend/src/app/globals.css:511` 雾气动画 9 秒无限循环；
- `frontend/src/app/globals.css:518` 雾气动画 12 秒无限循环；
- 没有全局 `@media (prefers-reduced-motion: reduce)`；
- 只有底部导航单独检测 `prefers-reduced-motion`：
  - `frontend/src/components/app-bottom-nav.tsx:63`

修复建议：

- 对所有非必要动画增加 `prefers-reduced-motion` 静态回退；
- 对自动开始且超过 5 秒的动画提供暂停/停止/隐藏；
- 保留必要状态变化，但移除位移、翻转和持续漂移；
- AAA 增强：交互触发的抖动和翻转也应可关闭。

### A11Y-012 — P2：后台在移动端和窄视口发生页面级横向溢出

对应标准：

- [1.4.10 Reflow（AA）](https://www.w3.org/TR/WCAG22/#reflow)

影响范围：

- 用户；
- 登录会话；
- 登录方式；
- 命理档案；
- 八字排盘。

证据：

- 412px 宽度：
  - 用户列表页面级横向溢出约 469px；
  - 其他资源约 494–773px；
  - 表格祖先均为 `overflow-x: visible`，没有局部滚动容器。
- 320px 等效视口：
  - 主内容宽约 891px；
  - 页面级横向溢出约 586px。
- 1440px 桌面端无溢出。
- `frontend/src/components/admin/admin-app.tsx:81` 等位置直接使用默认 `Datagrid`，没有移动布局或受控滚动容器。

说明：

- 数据表本身可能属于“确需二维布局”的 WCAG 例外；
- 但当前溢出发生在整个页面，而不是带名称、可聚焦的局部表格容器，顶部操作和其他页面内容也随之横向移动，因此仍构成实际障碍。

修复建议：

- 小屏改为卡片/定义列表；
- 或把表格放入有可访问名称、可键盘聚焦的局部横向滚动容器；
- 固定关键列或提供“查看详情”；
- 顶部搜索、刷新、导出和分页必须独立回流，不随表格整体溢出。

### A11Y-013 — P2：`/bazi/demo/ganzhi` 主内容为空且没有标题

对应标准：

- [2.4.6 Headings and Labels（AA）](https://www.w3.org/TR/WCAG22/#headings-and-labels)

证据：

- 线上页面有 `main`，但没有任何 heading；
- 源码只渲染返回按钮：
  - `frontend/src/app/bazi/demo/ganzhi/page.tsx:11`
  - `frontend/src/app/bazi/demo/ganzhi/page.tsx:20`

影响：

- 直接访问时无法理解页面用途；
- 读屏标题导航找不到主标题；
- 看起来像未完成或错误状态，但没有说明。

修复建议：

- 若该路由不应公开，生产环境重定向或返回 404；
- 若需要保留，提供明确 `h1`、页面说明和实际内容；
- 不要发布只有返回按钮的空主区域。

## 4. 已通过或表现较好的项目

抽样中确认：

- 根文档正确设置 `lang="zh-CN"`；
- 绝大多数公开页面有且只有一个 `main` 和一个 `h1`；
- 首页、八字、记录、隐私政策、六爻摇卦页在 320px 下无页面级横向溢出；
- 抽样页面未发现重复 ID 或正数 `tabindex`；
- 主要图标按钮大多有可访问名称；
- 登录协议复选框有明确名称；
- 八字结果顶部内容导航使用 `aria-current="page"`；
- 奇门宫位使用命名 `region`；
- 大六壬盘面使用命名 `group`、`dl` 和列表；
- 后台数据表具备真实 `table`、行、列头和排序按钮语义；
- 后台抽屉正确使用 modal 语义、锁定背景滚动，并把焦点放入弹层；
- 普通账号昵称编辑打开时会自动聚焦输入框；
- 奇门表单校验失败时会把焦点移到出生年份输入。

这些正向实现可以作为修复其他模块时的复用参考。

## 5. 修复优先级与建议顺序

### 第一批：阻断发布的 P1

1. 移除缩放限制；
2. 建立统一可访问 Dialog / Sheet；
3. 替换日期时间滚轮的交互与语义；
4. 为八字、紫微、六爻提供完整结构化命盘。

### 第二批：全局基础能力

1. 重做浅色/深色色彩令牌；
2. 统一表单 Field 组件，自动处理标签、说明、错误和焦点；
3. 加入全局 `focus-visible`；
4. 完整实现或移除伪 tabs；
5. 为每个路由增加 metadata；
6. 增加 reduced-motion 策略。

### 第三批：后台与长尾页面

1. 后台移动布局与局部表格滚动；
2. 后台标题、地标和中文可访问名称；
3. 处理 `/bazi/demo/ganzhi`；
4. 复核加载、空数据和同步失败播报。

## 6. 建议的自动化门禁

建议在修复时加入：

- axe-core：每个主要路由、弹层和结果页；
- Playwright 键盘测试：
  - Tab 顺序；
  - Escape；
  - 焦点进入/约束/恢复；
  - tabs 方向键；
  - 表单首个错误聚焦；
- 颜色令牌对比度单元测试；
- Lighthouse CI；
- 320px、412px、1440px 截图与页面级横向溢出断言；
- 每次发布前的 Safari + VoiceOver、iOS 放大与 Android TalkBack 人工抽样。

自动化不能替代人工读屏和键盘测试。

## 7. 建议的复测清单

- [ ] iOS Safari 可以缩放到 200% 和 400%。
- [ ] Android Chrome 可以缩放且表单不被键盘遮挡。
- [ ] 所有弹层具备名称、modal、焦点约束、Escape 和焦点恢复。
- [ ] 日期时间在 VoiceOver/TalkBack 下可在合理步骤内完成。
- [ ] 八字、紫微、六爻的所有核心数据关系可被读屏理解。
- [ ] 浅色和深色所有正文达到 4.5:1，大文本达到 3:1。
- [ ] 每个输入都有持久标签，错误与说明被关联和播报。
- [ ] 所有可操作控件都有清晰的 `focus-visible`。
- [ ] 每个路由有唯一页面标题。
- [ ] 减少动态效果开启时没有持续漂移、抖动或翻转。
- [ ] 后台在 320px 下仅表格容器局部滚动，页面本身不横向溢出。
- [ ] Lighthouse/axe 无 A/AA 阻断项。

## 8. 测试数据与环境恢复

- 普通账号和管理员账号均已退出；
- 网站主题已恢复为“跟随系统”；
- 临时浏览器视口覆盖已恢复默认；
- macOS VoiceOver 已确认关闭；
- 未修改或删除任何原有用户/后台数据；
- 本轮创建的“无障碍测试事项”奇门记录可以精确检索到。退出账号后尝试删除未成功，记录仍存在；需要重新登录测试账号后手动删除；
- 除本报告外，没有修改业务代码。
