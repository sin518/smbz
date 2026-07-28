import test from "node:test";
import assert from "node:assert/strict";
import { register } from "node:module";

register("./alias-loader-hooks.mjs", import.meta.url);

const { buildAiCommandText } = await import("../src/lib/ai/bazi-command.ts");

test("bazi AI command separates the reading summary from its complete evidence", () => {
  const chart = {
    profile: {
      name: "测试用户",
      gender: "男",
      solar: "1990-05-17 09:30",
      solarTime: "1990-05-17 09:18",
      location: "广东省广州市",
    },
    columns: [
      { title: "年柱", pillar: { stem: "庚", branch: "午" } },
      { title: "月柱", pillar: { stem: "辛", branch: "巳" } },
      { title: "日柱", pillar: { stem: "壬", branch: "午" } },
      { title: "时柱", pillar: { stem: "乙", branch: "巳" } },
    ],
    luckCycles: [
      { year: "2024", age: "35-44岁", stem: "己", branch: "卯", tags: [] },
      { year: "2034", age: "45-54岁", stem: "庚", branch: "辰", tags: [] },
    ],
    years: [],
    canonicalText: [
      "# 八字排盘",
      "- 四柱：庚午 辛巳 壬午 乙巳",
      "- 月令：巳",
      "- 天干五合：无合化成立",
    ].join("\n"),
  };

  const command = buildAiCommandText({
    chart,
    focus: "事业",
    useSolarTime: true,
  });

  assert.match(command, /【一级边界-必须拒绝分析】/u);
  assert.match(command, /扶抑安全线/u);
  assert.match(command, /健康不得写医疗诊断/u);
  assert.match(command, /# 快速浏览/u);
  assert.match(command, /## 一句话结论/u);
  assert.match(command, /## 命局主轴/u);
  assert.match(command, /## 运势节奏/u);
  assert.match(command, /## 行动建议/u);
  assert.match(command, /# 完整依据/u);
  assert.match(command, /## 输入核验/u);
  assert.match(command, /## 旺衰与格局/u);
  assert.match(command, /## 喜忌与专项/u);
  assert.match(command, /## 大运流年/u);
  assert.match(command, /## 证据与边界/u);
  assert.match(command, /摘要约 300–500 个中文字符/u);
  assert.match(command, /同一结论只完整表达一次/u);
  assert.match(command, /禁止使用 Markdown 表格/u);
  assert.match(command, /不要使用 HTML <details>/u);
  assert.doesNotMatch(command, /字数控制在3000-3500字|字数控制在2000-2500字/u);
});
