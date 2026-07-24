/**
 * 验证bazi-command.ts的关键功能
 */

const { buildAiCommandText } = require('./packages/core/dist/ai/bazi-command');

// 测试数据：一个简单的八字示例
const testChart = {
  profile: {
    name: "测试用户",
    gender: "男",
    solar: "2000年1月1日 12:00",
    location: "北京",
    solarTime: "2000年1月1日 12:05",
  },
  columns: [
    {
      pillar: { stem: "己", branch: "卯" },
      hiddenStems: [{ stem: "乙", element: "木", weight: 0.7 }],
    },
    {
      pillar: { stem: "丙", branch: "子" },
      hiddenStems: [{ stem: "癸", element: "水", weight: 0.7 }],
    },
    {
      pillar: { stem: "甲", branch: "午" },
      hiddenStems: [
        { stem: "丁", element: "火", weight: 0.7 },
        { stem: "己", element: "土", weight: 0.3 },
      ],
    },
    {
      pillar: { stem: "庚", branch: "午" },
      hiddenStems: [
        { stem: "丁", element: "火", weight: 0.7 },
        { stem: "己", element: "土", weight: 0.3 },
      ],
    },
  ],
  luckCycles: [
    {
      stem: "丁",
      branch: "丑",
      startYear: 2008,
      endYear: 2018,
      age: { start: 8, end: 17 },
    },
    {
      stem: "戊",
      branch: "寅",
      startYear: 2018,
      endYear: 2028,
      age: { start: 18, end: 27 },
    },
  ],
  canonicalText: "测试排盘文本\n天干五合：无\n地支六合：无",
};

console.log("========================================");
console.log("测试1: 全项分析");
console.log("========================================");

try {
  const result1 = buildAiCommandText({
    chart: testChart,
    focus: "全项",
    useSolarTime: false,
  });

  // 验证关键内容是否存在
  const checks = [
    { name: "三级边界体系", pattern: /【数据完整性分层处理】/ },
    { name: "扶抑安全线优先", pattern: /扶抑安全线\(身强身弱\)>/ },
    { name: "强制逻辑-身弱", pattern: /【强制逻辑-身弱时】.*印星与比劫必须列为主用神/ },
    { name: "强制逻辑-身强", pattern: /【强制逻辑-身强时】.*官杀、食伤、财星必须列为主用神/ },
    { name: "从格判定", pattern: /【特殊格局判定-从格】/ },
    { name: "化气格判定", pattern: /【特殊格局判定-化气格】/ },
    { name: "文风分层", pattern: /【文风分层】/ },
    { name: "字数控制", pattern: /focus="全项":完整输出所有章节,字数控制在3000-3500字/ },
    { name: "地支关系（六合）", pattern: /子丑合土、寅亥合木/ },
    { name: "藏干权重说明", pattern: /【藏干权重说明】/ },
  ];

  let passed = 0;
  let failed = 0;

  checks.forEach(({ name, pattern }) => {
    if (pattern.test(result1)) {
      console.log(`✓ ${name}`);
      passed++;
    } else {
      console.log(`✗ ${name}`);
      failed++;
    }
  });

  console.log(`\n总计: ${passed}/${checks.length} 通过\n`);

  if (failed > 0) {
    process.exit(1);
  }
} catch (error) {
  console.error("测试1失败:", error.message);
  process.exit(1);
}

console.log("========================================");
console.log("测试2: 专项分析（财运）");
console.log("========================================");

try {
  const result2 = buildAiCommandText({
    chart: testChart,
    focus: "财运",
    useSolarTime: true,
  });

  const checks2 = [
    {
      name: "财运专项描述",
      pattern: /重点分析财富结构、收入方式.*大运重点看财星运/,
    },
    {
      name: "字数控制（专项）",
      pattern: /focus="专项".*字数控制在2000-2500字/,
    },
  ];

  let passed = 0;
  let failed = 0;

  checks2.forEach(({ name, pattern }) => {
    if (pattern.test(result2)) {
      console.log(`✓ ${name}`);
      passed++;
    } else {
      console.log(`✗ ${name}`);
      failed++;
    }
  });

  console.log(`\n总计: ${passed}/${checks2.length} 通过\n`);

  if (failed > 0) {
    process.exit(1);
  }
} catch (error) {
  console.error("测试2失败:", error.message);
  process.exit(1);
}

console.log("========================================");
console.log("所有测试通过！✓");
console.log("========================================");
