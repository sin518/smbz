import test from "node:test";
import assert from "node:assert/strict";

import { buildLiuyaoAiCommandText } from "../src/lib/ai/liuyao-command.ts";

test("liuyao AI command keeps the full evidence while exposing a concise reading layer", () => {
  const chart = {
    profile: {
      castingText: "2026-07-28 10:30",
      direction: "事业学业",
      question: "今年下半年能找到远程工作吗？",
    },
    canonicalText: [
      "# 六爻排盘",
      "- 四柱：丙午年 乙未月 癸卯日 丁巳时",
      "- 旬空：辰、巳",
      "- 本卦：风雷益",
      "- 二爻为世，五爻为应",
      "- 二爻官鬼酉金发动，化父母戌土",
    ].join("\n"),
    skillWorkflow: {
      yongShenTargets: ["官鬼"],
      timeRecommendations: ["逢酉日／月观察岗位推进"],
      warnings: [],
    },
  };

  const command = buildLiuyaoAiCommandText(chart);

  assert.match(command, /规范排盘无条件信任/u);
  assert.match(command, /用神不明时必须追问/u);
  assert.match(command, /# 快速浏览/u);
  assert.match(command, /## 一句话结论/u);
  assert.match(command, /## 用神与动变/u);
  assert.match(command, /## 应期线索/u);
  assert.match(command, /## 行动建议/u);
  assert.match(command, /# 完整依据/u);
  assert.match(command, /## 输入核验/u);
  assert.match(command, /## 取用依据/u);
  assert.match(command, /## 旺衰与动变/u);
  assert.match(command, /## 世应与应期/u);
  assert.match(command, /## 证据与边界/u);
  assert.match(command, /摘要约 300–500 个中文字符/u);
  assert.match(command, /同一结论只完整表达一次/u);
  assert.match(command, /禁止使用 Markdown 表格/u);
  assert.match(command, /不要使用 HTML <details>/u);
  assert.doesNotMatch(command, /必填，100-200字|必填，300-500字/u);
});
