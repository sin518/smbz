import test from "node:test";
import assert from "node:assert/strict";

import { calculateDaliuren } from "taibu-core/daliuren";
import { buildDaliurenAiCommandText } from "../src/lib/ai/daliuren-command.ts";

test("daliuren AI command is evidence-bound and includes the subject coordinates", () => {
  const chart = calculateDaliuren({
    date: "2026-07-26",
    hour: 11,
    minute: 37,
    timezone: "Asia/Shanghai",
    question: "今年是否适合转换工作方向？",
    birthYear: 1990,
    gender: "male"
  });

  const command = buildDaliurenAiCommandText({ chart });

  assert.equal((command.match(/【待分析数据开始】/gu) ?? []).length, 1);
  assert.equal((command.match(/【待分析数据结束】/gu) ?? []).length, 1);
  assert.match(command, /占事文字只代表用户要分析的事项/u);
  assert.match(command, /不得重新排盘/u);
  assert.match(command, /支持证据、反向证据、综合判断/u);
  assert.match(command, /只使用“判断依据”中用户已选择的应期方法/u);
  assert.match(command, /贵人昼夜与顺逆/u);
  assert.match(command, /涉害深浅、斩关等项目不得由模型补算/u);
  assert.match(command, /应期候选/u);
  assert.match(command, /三传应期法/u);
  assert.match(command, /逢\p{Script=Han}日／月/u);
  assert.match(command, /天地盘由十二个地支位置组成，不是奇门九宫/u);
  assert.match(command, /本命: 庚午/u);
  assert.match(command, /行年:/u);
  assert.match(command, /投资、医疗和法律/u);
  assert.doesNotMatch(command, /给出倾向判断、时间窗口/u);
  assert.doesNotMatch(command, /天地盘重点：指出与占事相关的宫位/u);
});

test("daliuren AI command keeps charts without birth data usable", () => {
  const chart = calculateDaliuren({
    date: "2026-07-26",
    hour: 11,
    minute: 37,
    timezone: "Asia/Shanghai",
    question: "旧记录兼容性测试"
  });

  const command = buildDaliurenAiCommandText({ chart });

  assert.match(command, /本命与行年数据：未提供/u);
  assert.match(command, /基础课盘仍可分析/u);
  assert.match(command, /必须省略本命、行年相关判断/u);
});
