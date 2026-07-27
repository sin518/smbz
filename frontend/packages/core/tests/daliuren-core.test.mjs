import test from 'node:test';
import assert from 'node:assert/strict';

import { calculateDaliuren, toDaliurenJson, toDaliurenText } from 'taibu-core';

test('daliuren basic output should have correct structure and field types', () => {
  const result = calculateDaliuren({
    date: '2026-04-10',
    hour: 14,
    minute: 30,
    question: '测试',
});

  // dateInfo
  assert.ok(result.dateInfo, 'dateInfo should exist');
  assert.equal(typeof result.dateInfo.solarDate, 'string');
  assert.ok(result.dateInfo.solarDate.length > 0, 'solarDate should be non-empty');
  assert.equal(typeof result.dateInfo.bazi, 'string');
  assert.ok(result.dateInfo.bazi.length > 0, 'bazi should be non-empty');
  assert.equal(typeof result.dateInfo.yueJiang, 'string');
assert.ok(result.dateInfo.yueJiang.length > 0, 'yueJiang should be non-empty');
  assert.ok(Array.isArray(result.dateInfo.kongWang), 'kongWang should be an array');
  assert.equal(result.dateInfo.kongWang.length, 2, 'kongWang should have 2 elements');
  assert.equal(typeof result.dateInfo.yiMa, 'string');
  assert.ok(result.dateInfo.yiMa.length > 0, 'yiMa should be non-empty');

  // siKe
  assert.ok(result.siKe, 'siKe should exist');
assert.ok(Array.isArray(result.siKe.yiKe), 'yiKe should be an array');
assert.ok(result.siKe.yiKe.length > 0, 'yiKe should be non-empty');
  assert.ok(Array.isArray(result.siKe.erKe), 'erKe should be an array');
  assert.ok(result.siKe.erKe.length > 0, 'erKe should be non-empty');
  assert.ok(Array.isArray(result.siKe.sanKe), 'sanKe should be an array');
  assert.ok(result.siKe.sanKe.length > 0, 'sanKe should be non-empty');
  assert.ok(Array.isArray(result.siKe.siKe), 'siKe should be an array');
  assert.ok(result.siKe.siKe.length > 0, 'siKe should be non-empty');

  // sanChuan
  assert.ok(result.sanChuan, 'sanChuan should exist');
  assert.ok(Array.isArray(result.sanChuan.chu), 'chu should be an array');
  assert.ok(result.sanChuan.chu.length > 0, 'chu should be non-empty');
  assert.ok(Array.isArray(result.sanChuan.zhong), 'zhong should be an array');
  assert.ok(result.sanChuan.zhong.length > 0, 'zhong should be non-empty');
  assert.ok(Array.isArray(result.sanChuan.mo), 'mo should be an array');
assert.ok(result.sanChuan.mo.length > 0, 'mo should be non-empty');

  // gongInfos
  assert.ok(Array.isArray(result.gongInfos), 'gongInfos should be an array');
  assert.equal(result.gongInfos.length, 12, 'gongInfos should have 12 elements');

  for (const gong of result.gongInfos) {
    assert.equal(typeof gong.diZhi, 'string');
    assert.ok(gong.diZhi.length > 0, 'diZhi should be non-empty');
    assert.equal(typeof gong.tianZhi, 'string');
    assert.ok(gong.tianZhi.length > 0, 'tianZhi should be non-empty');
    assert.equal(typeof gong.tianJiang, 'string');
    assert.equal(typeof gong.changSheng, 'string');
assert.equal(typeof gong.wangShuai, 'string');
  }
});

test('daliuren keTi should have method and subTypes', () => {
  const result = calculateDaliuren({
    date: '2026-04-10',
    hour: 14,
    minute: 30,
    question: '测试',
  });

  assert.ok(result.keTi, 'keTi should exist');
  assert.equal(typeof result.keTi.method, 'string');
  assert.ok(result.keTi.method.length > 0, 'keTi.method should be non-empty');
  assert.ok(Array.isArray(result.keTi.subTypes), 'keTi.subTypes should be an array');
});

test('daliuren JSON rendering should return non-empty output', () => {
  const result = calculateDaliuren({
    date: '2026-04-10',
    hour: 14,
    minute: 30,
    question: '测试',
  });

  const json = toDaliurenJson(result);
  assert.ok(json, 'toDaliurenJson should return a non-empty result');
  assert.ok(typeof json === 'object', 'toDaliurenJson should return an object');
  assert.ok(Object.keys(json).length > 0, 'toDaliurenJson output should have keys');
});

test('daliuren text rendering should return non-empty string', () => {
  const result = calculateDaliuren({
    date: '2026-04-10',
    hour: 14,
    minute: 30,
    question: '测试',
  });

  const text = toDaliurenText(result);
  assert.equal(typeof text, 'string');
  assert.ok(text.length > 0, 'toDaliurenText should return a non-empty string');
});

test('daliuren analysis basis should expose guiren, nine-gate derivation and strength evidence', () => {
  const result = calculateDaliuren({
    date: '2026-04-10',
    hour: 18,
    minute: 30,
    question: '判断依据测试',
  });

  assert.equal(result.dateInfo.diurnal, false, '酉时 should use 夜贵');
  assert.equal(result.analysisBasis.guiRen.dayNight, '夜贵');
  assert.equal(result.analysisBasis.guiRen.yinYang, '阴贵');
  assert.match(result.analysisBasis.guiRen.direction, /^(顺布|逆布)$/u);
  assert.equal(result.analysisBasis.transmission.derivationComplete, true);
  assert.equal(result.analysisBasis.transmission.referenceMatch, true);
  assert.ok(result.analysisBasis.transmission.steps.length > 0);
  assert.equal(result.analysisBasis.transmission.steps[0].gate, '贼克');
  assert.ok(result.analysisBasis.timing.clues.length > 0);
  assert.ok(result.gongInfos.every((gong) => gong.wangShuaiBasis.includes('月令')));

  const text = toDaliurenText(result, { detailLevel: 'full' });
  assert.match(text, /## 判断依据/u);
  assert.match(text, /贵人布法:/u);
  assert.match(text, /发用依据:/u);
  assert.match(text, /第1步〔贼克〕/u);
  assert.doesNotMatch(text, /liuren-ts-lib|课表匹配结果/u);
  assert.match(text, /旺衰依据/u);
  assert.match(text, /天盘 \(月将·五行·状态\)/u);
  assert.doesNotMatch(text, /地盘 \(五行·状态\)/u);
});

test('daliuren timing should always use transmission clues and treat kong-wang as a conditional modifier', () => {
  const result = calculateDaliuren({
    date: '2026-01-01',
    hour: 6,
  });
  const legacyKongWangInput = calculateDaliuren({
    date: '2026-01-01',
    hour: 6,
    timingMethod: 'kong-wang',
  });
  const clues = result.analysisBasis.timing.clues;
  const emptyClue = clues.find((clue) => clue.branch === '酉');

  assert.deepEqual(legacyKongWangInput.analysisBasis.timing, result.analysisBasis.timing);
  assert.equal(new Set(clues.map((clue) => clue.branch)).size, clues.length);
  assert.equal(emptyClue?.kind, 'conditional');
  assert.match(emptyClue?.window ?? '', /填实|出旬/u);
  assert.equal('confidence' in (emptyClue ?? {}), false);

  const noEmptyTransmission = calculateDaliuren({
    date: '2026-04-10',
    hour: 18,
    timingMethod: 'kong-wang',
  });
  assert.ok(noEmptyTransmission.analysisBasis.timing.clues.length > 0);
  assert.ok(noEmptyTransmission.analysisBasis.timing.clues.every((clue) => clue.kind === 'base'));
  assert.doesNotMatch(noEmptyTransmission.analysisBasis.timing.note, /空亡填实|不适用/u);

  const repeatedTransmission = calculateDaliuren({
    date: '2026-01-27',
    hour: 6,
  });
  const mergedClue = repeatedTransmission.analysisBasis.timing.clues.find((clue) => clue.branch === '未');
  assert.deepEqual(mergedClue?.roles, ['中传', '末传']);
  assert.equal(
    repeatedTransmission.analysisBasis.timing.clues.filter((clue) => clue.branch === '未').length,
    1,
  );

  const text = toDaliurenText(result, { detailLevel: 'full' });
  assert.match(text, /应期触发线索/u);
  assert.match(text, /条件线索/u);
  assert.doesNotMatch(text, /应期方法|置信度/u);

  const json = toDaliurenJson(result, { detailLevel: 'full' });
  assert.ok(Array.isArray(json.判断依据?.应期.触发线索));
  assert.equal(json.判断依据?.应期.触发线索[0]?.类型 === '基础线索'
    || json.判断依据?.应期.触发线索[0]?.类型 === '条件线索', true);
  assert.equal('方法' in (json.判断依据?.应期 ?? {}), false);
});
