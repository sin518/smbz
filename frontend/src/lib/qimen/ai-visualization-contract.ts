export const QIMEN_AI_CHART_TYPES = ["divination_verdict"] as const;

export const QIMEN_DIVINATION_VERDICT_REQUIRED_FIELDS = [
  "verdict",
  "verdictScore",
  "confidence",
  "question",
  "keyFactors",
  "actionAdvice"
] as const;

export function buildQimenVisualizationContractPrompt() {
  return `【重要】请在分析中输出至少一个 \`\`\`chart 代码块。
代码块内部必须是合法 JSON，包含 chartType、title、data 字段。
请使用以下图表类型：
- ${QIMEN_AI_CHART_TYPES[0]}: 适合展示占卜吉凶判断，data 需包含 ${QIMEN_DIVINATION_VERDICT_REQUIRED_FIELDS.join("、")}。
不要输出注释、省略号或无法解析的占位字段。
优先给出最有价值的 1-2 个图表。`;
}
