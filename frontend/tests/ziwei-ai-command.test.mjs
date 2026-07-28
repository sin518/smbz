import test from "node:test";
import assert from "node:assert/strict";

import { buildZiweiAiCommandText } from "../src/lib/ai/ziwei-command.ts";
import { calculateZiweiChart } from "../src/lib/ziwei/calculate.ts";

test("ziwei AI command exposes a layered mobile-readable interpretation contract", () => {
  const chart = calculateZiweiChart({
    name: "测试用户",
    gender: "male",
    birthTime: "1990-05-17T09:30",
    location: "广东省广州市",
  });

  const command = buildZiweiAiCommandText({ chart, focus: "事业" });

  assert.match(command, /分析方向：事业/u);
  assert.match(command, /数据自纠偏规则/u);
  assert.match(command, /禁止宿命论、恐吓式表达、医疗诊断、投资保证、婚姻绝对判断/u);
  assert.match(command, /# 快速浏览/u);
  assert.match(command, /## 一句话结论/u);
  assert.match(command, /## 命身主轴/u);
  assert.match(command, /## 运势节奏/u);
  assert.match(command, /## 行动建议/u);
  assert.match(command, /# 完整依据/u);
  assert.match(command, /## 输入核验/u);
  assert.match(command, /## 命盘骨架/u);
  assert.match(command, /## 专项宫位/u);
  assert.match(command, /## 运限与时间/u);
  assert.match(command, /## 证据与边界/u);
  assert.match(command, /摘要约 300–500 个中文字符/u);
  assert.match(command, /同一结论只完整表达一次/u);
  assert.match(command, /禁止使用 Markdown 表格/u);
  assert.match(command, /不要使用 HTML <details>/u);
});
