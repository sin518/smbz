import test from 'node:test';
import assert from 'node:assert/strict';

import { calculateQimen } from 'taibu-core/qimen';
import { buildQimenAiCommandText } from '../src/lib/ai/qimen-command.ts';

test('qimen AI command defaults to a comprehensive reading with the resolved nianMing coordinate', async () => {
  const chart = await calculateQimen({
    year: 2026,
    month: 4,
    day: 10,
    hour: 14,
    minute: 30,
    timezone: 'Asia/Shanghai',
    question: '今年是否适合转换工作方向？',
    birthYear: 1984,
  });

  const command = buildQimenAiCommandText({ chart });

  assert.match(command, /解读主题：综合分析/u);
  assert.match(command, /出生年干支[:：] 甲子/u);
  assert.match(command, /年命定位[:：] 甲命，遁戊，天盘落巽4宫/u);
  assert.match(command, /戊：辰冠带、巳临官/u);
  assert.doesNotMatch(command, /奇门遁甲财运详解/u);
  assert.equal((command.match(/【待分析数据开始】/gu) ?? []).length, 1);
  assert.equal((command.match(/【待分析数据结束】/gu) ?? []).length, 1);
  assert.match(command, /支持证据、反向证据、综合判断/u);
  assert.match(command, /不得自行补排或补算/u);
  assert.match(command, /# 快速浏览/u);
  assert.match(command, /## 一句话结论/u);
  assert.match(command, /## 核心关系/u);
  assert.match(command, /日干、时干、年命宫和事项用神宫/u);
  assert.match(command, /## 时间线索/u);
  assert.match(command, /## 行动建议/u);
  assert.match(command, /# 完整依据/u);
  assert.match(command, /## 盘面核验/u);
  assert.match(command, /## 关键宫位/u);
  assert.match(command, /## 完整论证/u);
  assert.match(command, /## 证据与边界/u);
  assert.match(command, /摘要约 300–500 个中文字符/u);
  assert.match(command, /同一结论只完整表达一次/u);
  assert.match(command, /禁止使用 Markdown 表格/u);
  assert.match(command, /不要使用 HTML <details>/u);
  assert.doesNotMatch(command, /正文约 1200–2000 个中文字符/u);
  assert.doesNotMatch(command, /大凶无解|严禁投资|建议撤诉|届时必有损失/u);
});

test('qimen AI command keeps legacy charts usable while marking the missing nianMing coordinate', async () => {
  const legacyChart = await calculateQimen({
    year: 2026,
    month: 4,
    day: 10,
    hour: 14,
    minute: 30,
    timezone: 'Asia/Shanghai',
    question: '旧记录兼容性测试',
  });

  const command = buildQimenAiCommandText({ chart: legacyChart });

  assert.match(command, /年命数据：未提供/u);
  assert.match(command, /基础盘仍可解读/u);
});
