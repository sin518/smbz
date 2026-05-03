# AGENTS.md

## 🧭 项目目标

本项目是一款「八字排盘 + AI 分析」的软件，核心能力包括：

- 用户输入出生信息自动排盘
- 展示完整四柱命盘信息
- 结合 AI 输出结构化命理分析报告
- 支持记录保存、查询
- 后续支持付费、导出、合盘、AI 问答等功能

---

## 🧱 技术栈约束

必须优先使用：

- Next.js App Router
- TypeScript 严格模式
- React
- TailwindCSS
- ShadCN UI
- Prisma ORM
- nest.js
- PostgreSQL / Neon
- React Hook Form + Zod
- OpenAI / DeepSeek API

禁止：

- 滥用 any
- 在 UI 组件中写复杂业务逻辑
- 在前端暴露 API Key
- 把长 Prompt 直接写在页面或 API Route 中
- 直接提交 `.env` 文件

---

## 📦 项目模块设计

### 1. 排盘输入模块

用户输入项：

- 姓名，可选
- 性别，必选
- 出生时间，精确到分钟
- 出生地点，省市区
- 是否使用真太阳时
- 公历 / 农历 / 四柱输入模式

要求：

- 使用 React Hook Form + Zod
- 表单必须有完整校验
- 错误提示清晰
- 时间与时区处理严谨
- 出生地点后续应支持经纬度

---

### 2. 八字排盘计算模块

八字排盘逻辑必须独立封装为纯函数，不允许直接写在页面组件中。

需要支持：

- 年柱、月柱、日柱、时柱
- 天干地支
- 藏干
- 十神
- 纳音
- 空亡
- 十二长生
- 胎元 / 命宫 / 身宫
- 神煞
- 大运
- 流年
- 流月

推荐目录：

```txt
src/lib/bazi/
├── ganzhi.ts        # 干支计算
├── calendar.ts      # 公历农历转换
├── solarTime.ts     # 真太阳时
├── tenGods.ts       # 十神
├── hiddenStems.ts   # 藏干
├── nayin.ts         # 纳音
├── shensha.ts       # 神煞
├── luck.ts          # 大运流年
└── index.ts
```

要求：

- 所有计算函数必须可单独测试
- 不允许硬编码具体用户结果
- 必须可复用、可扩展
- 不确定的命理规则必须标注 TODO，不要强行编造

---

### 3. AI 分析模块

AI 只负责解释，不负责排盘计算。

输入：

- 用户基本信息
- 八字排盘结果 JSON
- 五行分布
- 十神结构
- 大运流年信息

输出必须包含六个维度：

1. 命格结构与性格特征
2. 事业方向与能力优势
3. 财运结构与财富趋势
4. 健康体质与养护方向
5. 婚姻感情与人际关系
6. 未来五年运势趋势

每个维度必须包含：

- 推理过程
- 分析结论
- 现实建议

限制：

- 禁止宿命论
- 禁止恐吓式表达
- 禁止医疗诊断
- 禁止投资保证
- 禁止婚姻绝对判断
- 必须解释命理术语
- 必须输出结构清晰、可理解、可执行的建议

Prompt 必须独立存放：

```txt
src/prompts/bazi-analysis.ts
```

---

### 4. 数据库设计

核心表建议：

```prisma
model User {
  id        String   @id @default(cuid())
  email     String?  @unique
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model BaziProfile {
  id          String   @id @default(cuid())
  userId      String?
  name        String?
  gender      String
  birthTime   DateTime
  calendar    String
  location    String?
  longitude   Float?
  latitude    Float?
  useSolarTime Boolean @default(false)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model BaziChart {
  id        String   @id @default(cuid())
  profileId String
  chartJson Json
  createdAt DateTime @default(now())
}

model AiReport {
  id        String   @id @default(cuid())
  chartId   String
  content   String
  model     String?
  createdAt DateTime @default(now())
}
```

要求：

- 用户输入信息、排盘结果、AI 报告分开存储
- 排盘结果使用 JSON 存储，方便扩展
- AI 报告独立存储，方便后续做付费、导出、历史记录

---

## 🧭 页面结构

推荐页面结构：

```txt
app/
├── page.tsx
├── bazi/new/page.tsx
├── bazi/[id]/page.tsx
├── bazi/[id]/analysis/page.tsx
├── records/page.tsx
└── settings/page.tsx
```

---

## 🎨 UI 设计规范

风格参考移动端命理排盘 App：

- 主色：黑色、金色、白色
- 卡片式布局
- 信息分区明确
- 四柱排盘使用表格布局
- 大运、流年、流月使用横向滑动卡片
- 移动端优先
- 桌面端自适应

禁止：

- 过度花哨动画
- 信息堆叠混乱
- 字号过小导致移动端难阅读

---

## 🧪 代码规范

必须遵守：

- 所有组件拆分合理
- API 返回值必须定义 TypeScript 类型
- 表单必须校验
- 异步请求必须处理 loading、error、empty 状态
- 所有时间处理必须明确时区
- 不要写重复逻辑
- 不要删除已有功能
- 不要破坏现有 UI
- 不要把 API Key 写进前端代码

---

## 🚀 开发阶段

### 第一阶段：MVP

- [ ] 排盘输入页面
- [ ] 八字基础计算
- [ ] 排盘展示页面
- [ ] AI 分析报告
- [ ] 保存排盘记录

### 第二阶段

- [ ] 用户登录
- [ ] 历史记录
- [ ] 报告导出
- [ ] 会员限制
- [ ] 分享海报

### 第三阶段

- [ ] AI 问答
- [ ] 合盘分析
- [ ] 流年分析
- [ ] 财运专题分析
- [ ] 命理知识库 + RAG

---

## 🤖 给 AI 编程助手的规则

当执行开发任务时：

1. 先分析现有代码结构，再修改代码
2. 不要一次性大改整个项目
3. 每次只实现一个明确功能
4. 修改前说明会改哪些文件
5. 修改后说明如何测试
6. 涉及命理算法时必须说明计算逻辑
7. 不确定的命理规则必须标注 TODO
8. 不要删除已有功能
9. 不要破坏现有 UI
10. 优先保证可维护性、可测试性、可扩展性

---

## ⚠️ 重要原则

- 排盘 = 计算引擎，必须严谨
- AI = 解释层，负责表达和分析
- 排盘和 AI 分析必须完全解耦
- 软件建议必须现实可执行，不能制造焦虑

