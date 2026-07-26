import test from 'node:test';
import assert from 'node:assert/strict';

import { calculateQimen, toQimenJson, toQimenText } from 'taibu-core';

test('qimen basic output should have correct structure and field types', async () => {
  const result = await calculateQimen({
    year: 2026,
    month: 4,
    day: 10,
    hour: 14,
    minute: 30,
  });

  // dunType
  assert.ok(
    result.dunType === 'yang' || result.dunType === 'yin',
    `dunType should be 'yang' or 'yin', got '${result.dunType}'`,
  );

  // juNumber
  assert.ok(
    Number.isInteger(result.juNumber) && result.juNumber >= 1 && result.juNumber <= 9,
    `juNumber should be 1-9, got ${result.juNumber}`,
  );

  // palaces
  assert.equal(Array.isArray(result.palaces), true);
  assert.equal(result.palaces.length, 9);

  for (const palace of result.palaces) {
    assert.equal(typeof palace.palaceIndex, 'number');
    assert.equal(typeof palace.palaceName, 'string');
    assert.ok(palace.palaceName.length > 0, 'palaceName should be non-empty');
    assert.equal(typeof palace.star, 'string');
assert.equal(typeof palace.gate, 'string');
    assert.equal(typeof palace.deity, 'string');
    assert.equal(typeof palace.earthStem, 'string');
    assert.equal(typeof palace.heavenStem, 'string');
  }

  // kongWang
  assert.ok(result.kongWang, 'kongWang should exist');
  assert.ok(result.kongWang.dayKong, 'dayKong should exist');
assert.ok(result.kongWang.hourKong, 'hourKong should exist');
  assert.ok(Array.isArray(result.kongWang.dayKong.branches), 'dayKong.branches should be an array');
  assert.ok(Array.isArray(result.kongWang.hourKong.branches), 'hourKong.branches should be an array');

  // yiMa
  assert.ok(result.yiMa, 'yiMa should exist');
  assert.equal(typeof result.yiMa.branch, 'string');
  assert.equal(typeof result.yiMa.palace, 'number');

  // siZhu
  assert.ok(result.siZhu,'siZhu should exist');
  assert.equal(typeof result.siZhu.year, 'string');
  assert.equal(typeof result.siZhu.month, 'string');
  assert.equal(typeof result.siZhu.day,'string');
  assert.equal(typeof result.siZhu.hour, 'string');
  assert.ok(result.siZhu.year.length > 0, 'siZhu.year should be non-empty');
  assert.ok(result.siZhu.month.length > 0, 'siZhu.month should be non-empty');
  assert.ok(result.siZhu.day.length > 0, 'siZhu.day should be non-empty');
  assert.ok(result.siZhu.hour.length > 0, 'siZhu.hour should be non-empty');
});

test('qimen globalFormations should be an array', async () => {
  const result = await calculateQimen({
    year: 2026,
    month: 4,
    day: 10,
    hour: 14,
    minute: 30,
  });

  assert.ok(Array.isArray(result.globalFormations), 'globalFormations should be an array');
  for (const f of result.globalFormations) {
    assert.equal(typeof f, 'string', 'each formation should be a string');
  }
});

test('qimen should derive nianMing from birthYear', async () => {
  const result = await calculateQimen({
    year: 2026,
    month: 4,
    day: 10,
    hour: 14,
    minute: 30,
    birthYear: 1990,
  });

  assert.equal(result.birthYear, 1990);
  assert.equal(result.birthYearGanZhi, '庚午');
  assert.equal(result.nianMing, '庚');
  assert.equal(result.nianMingReferenceStem, '庚');
  assert.deepEqual(result.nianMingPalace, {
    palaceIndex: 2,
    palaceName: '坤',
  });
  assert.match(toQimenText(result), /年命: 庚/u);
  const json = toQimenJson(result);
  assert.equal(json.基本信息.出生年干支, '庚午');
  assert.equal(json.基本信息.年命, '庚');
  assert.equal(json.基本信息.年命定位干, '庚');
  assert.equal(json.基本信息.年命宫, '坤2宫');
});

test('qimen should locate a Jia nianMing by its Liu Jia hidden stem on the heaven plate', async () => {
  const result = await calculateQimen({
    year: 2026,
    month: 4,
    day: 10,
    hour: 14,
    minute: 30,
    birthYear: 1984,
  });

  assert.equal(result.birthYearGanZhi, '甲子');
  assert.equal(result.nianMing, '甲');
  assert.equal(result.nianMingReferenceStem, '戊');
  assert.deepEqual(result.nianMingPalace, {
    palaceIndex: 4,
    palaceName: '巽',
  });
  assert.equal(result.dayStemReferenceStem, '癸');
  assert.deepEqual(result.dayStemPalace, {
    palaceIndex: 3,
    palaceName: '震',
  });
  assert.equal(result.hourStemReferenceStem, '辛');
  assert.deepEqual(result.hourStemPalace, {
    palaceIndex: 7,
    palaceName: '兑',
  });

  const xunPalace = result.palaces.find((palace) => palace.palaceName === '巽');
  assert.deepEqual(xunPalace.branches, ['辰', '巳']);
  assert.deepEqual(xunPalace.heavenStemChangSheng, [
    {
      stem: '戊',
      stages: [
        { branch: '辰', stage: '冠带' },
        { branch: '巳', stage: '临官' },
      ],
    },
  ]);

  const xunJson = toQimenJson(result).九宫盘.find((palace) => palace.宫名 === '巽');
  assert.deepEqual(xunJson.宫位地支, ['辰', '巳']);
  assert.deepEqual(xunJson.天盘长生, [
    {
      天盘干: '戊',
      地支状态: ['辰冠带', '巳临官'],
    },
  ]);
  assert.equal(toQimenJson(result).基本信息.日干定位, '甲日，遁癸，天盘落震3宫');
  assert.equal(toQimenJson(result).基本信息.时干定位, '辛时，天盘落兑7宫');
  assert.match(toQimenText(result), /戊：辰冠带、巳临官/u);
  assert.match(toQimenText(result), /日干定位: 甲日，遁癸，天盘落震3宫/u);
});

test('qimen should locate nianMing from a carried heaven stem after center-palace lodging', async () => {
  const result = await calculateQimen({
    year: 2026,
    month: 4,
    day: 10,
    hour: 14,
    minute: 30,
    birthYear: 1982,
    zhiFuJiGong: 'ji_liuyi',
  });

  assert.equal(result.birthYearGanZhi, '壬戌');
  assert.equal(result.nianMingReferenceStem, '壬');
  assert.deepEqual(result.nianMingPalace, {
    palaceIndex: 9,
    palaceName: '离',
  });
  assert.deepEqual(result.palaces[8].heavenStems, ['丙', '壬']);
  assert.deepEqual(result.palaces[8].branches, ['午']);
  assert.deepEqual(result.palaces[8].heavenStemChangSheng, [
    {
      stem: '丙',
      stages: [{ branch: '午', stage: '帝旺' }],
    },
    {
      stem: '壬',
      stages: [{ branch: '午', stage: '胎' }],
    },
  ]);
  assert.match(toQimenText(result, { detailLevel: 'full' }), /\| 丙、壬 \|/u);
  assert.match(toQimenText(result, { detailLevel: 'full' }), /丙：午帝旺；壬：午胎/u);
});

test('qimen JSON rendering should return non-empty output', async () => {
  const result = await calculateQimen({
    year: 2026,
    month: 4,
    day: 10,
    hour: 14,
    minute: 30,
  });

  const json = toQimenJson(result);
  assert.ok(json, 'toQimenJson should return a non-empty result');
  assert.ok(typeof json === 'object', 'toQimenJson should return an object');
  assert.ok(Object.keys(json).length > 0, 'toQimenJson output should have keys');
});

test('qimen text rendering should return non-empty string', async () => {
  const result = await calculateQimen({
    year: 2026,
    month: 4,
    day: 10,
    hour: 14,
    minute: 30,
  });

  const text = toQimenText(result);
  assert.equal(typeof text, 'string');
  assert.ok(text.length > 0, 'toQimenText should return a non-empty string');
});

test('qimen concurrent calls should produce correct results with TZ mutex', async () => {
  const timezones = ['Asia/Shanghai', 'America/New_York', 'Europe/London', 'Asia/Tokyo', 'Australia/Sydney'];
  const results = await Promise.all(
    timezones.map((tz) =>
      calculateQimen({
        year: 2026,
        month: 4,
        day: 10,
        hour: 14,
        minute: 30,
        timezone: tz,
      }),
    ),
  );

  for (let i = 0; i < results.length; i++) {
    const r = results[i];
assert.ok(r.palaces.length === 9, `concurrent call ${i} should have 9 palaces`);
    assert.ok(r.dunType === 'yang' || r.dunType === 'yin', `concurrent call ${i} should have valid dunType`);
    assert.ok(r.juNumber >= 1 && r.juNumber <= 9, `concurrent call ${i} should have valid juNumber`);
    assert.ok(r.siZhu.year.length > 0, `concurrent call ${i} should have non-empty siZhu.year`);
  }
});

test('qimen should reject invalid timezone', async () => {
  assert.throws(
    () => calculateQimen({
      year: 2026,
      month: 4,
      day: 10,
      hour: 14,
      minute: 30,
      timezone: 'Invalid/Zone',
    }),
    /timezone 无效/u,
  );
});
