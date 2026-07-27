import assert from 'node:assert/strict';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { buildDaliurenAnalysisBasis } from '../dist/domains/daliuren/analysis.js';
import { deriveNineGate } from '../dist/domains/daliuren/derivation.js';

const BRANCHES = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
const STEM_HOME = {
  甲: '寅', 乙: '辰', 丙: '巳', 丁: '未', 戊: '巳',
  己: '未', 庚: '申', 辛: '戌', 壬: '亥', 癸: '丑',
};
const KNOWN_REFERENCE_DIFFERENCES = new Map([
  ['己亥:11', { expected: '亥卯未', derived: '未亥卯' }],
  ['丁卯:5', { expected: '亥酉未', derived: '丑亥酉' }],
  ['辛卯:8', { expected: '亥酉未', derived: '丑亥酉' }],
]);
const KNOWN_HIDDEN_CONFLICTS = new Set([
  '戊辰:4',
  '己丑:6',
  '己亥:11',
  '丁卯:5',
  '丁卯:11',
  '辛巳:8',
  '辛卯:8',
  '乙酉:10',
]);

const sourceMapPath = fileURLToPath(new URL(
  '../node_modules/liuren-ts-lib/dist/cjs/index.js.map',
  import.meta.url,
));
const sourceMap = JSON.parse(fs.readFileSync(sourceMapPath, 'utf8'));
const tableSourceIndex = sourceMap.sources.findIndex((source) => source.endsWith('/sanchuan.json'));
assert.notEqual(tableSourceIndex, -1, 'liuren-ts-lib source map must contain sanchuan.json');
const referenceTable = JSON.parse(sourceMap.sourcesContent[tableSourceIndex]);

let total = 0;
let matched = 0;
let matchedHarm = 0;
let zhanGuanCount = 0;
const differences = new Map();
const hiddenConflicts = new Set();

for (const [day, rows] of Object.entries(referenceTable)) {
  for (let rowIndex = 0; rowIndex < rows.length; rowIndex += 1) {
    total += 1;
    const reference = rows[rowIndex];
    const source = createSource(day, rowIndex, reference);
    const derivation = deriveNineGate(source);
    const derived = derivation.transmissions.join('');
    const expected = reference.干支组合;
    const key = `${day}:${rowIndex}`;
    const methodMatches = normalizeMethod(derivation.method) === normalizeMethod(reference.格局);
    const referenceMatches = derived === expected && methodMatches;

    if (derived === expected) {
      matched += 1;
      assert.ok(derivation.steps.length > 0, `${key} should include derivation steps`);
      if (reference.格局 === '涉害' && methodMatches) {
        assert.ok(derivation.harmDepth, `${key} should include harm depth`);
        matchedHarm += 1;
      }
    } else {
      differences.set(key, { expected, derived });
    }

    const basis = buildDaliurenAnalysisBasis(source);
    assert.equal(
      basis.transmission.referenceMatch,
      referenceMatches,
      `${key} internal reference flag should reflect the method and three-transmission comparison`,
    );
    if (!referenceMatches) {
      hiddenConflicts.add(key);
      assert.equal(basis.transmission.steps.length, 0, `${key} must not expose a conflicting derivation`);
      assert.equal(basis.transmission.harmDepth, null, `${key} must not expose conflicting harm depth`);
    }

    const zhanGuan = basis.keyPatterns.find((pattern) => pattern.name === '斩关');
    if (zhanGuan) {
      zhanGuanCount += 1;
      assert.ok(
        source.sanChuan.chu[0] === '辰' || source.sanChuan.chu[0] === '戌',
        `${key} 斩关 must use 魁罡 as the initial transmission`,
      );
      assert.ok(
        zhanGuan.positions.includes('日干') || zhanGuan.positions.includes('日支'),
        `${key} 斩关 must identify where 魁罡 lands`,
      );
    }
  }
}

assert.equal(total, 720, 'the reference table should cover all 720 charts');
assert.equal(matched, 717, 'unexpected nine-gate/reference regression');
assert.equal(matchedHarm, 72, 'unexpected harm-depth coverage regression');
assert.deepEqual(differences, KNOWN_REFERENCE_DIFFERENCES, 'known reference differences changed');
assert.deepEqual(hiddenConflicts, KNOWN_HIDDEN_CONFLICTS, 'hidden derivation conflicts changed');
assert.ok(zhanGuanCount > 0, '斩关 detector should match at least one 720-table chart');

console.log(`大六壬回归通过：${matched}/${total}课三传一致，涉害深浅${matchedHarm}课，斩关${zhanGuanCount}课。`);
console.log(`保留${hiddenConflicts.size}课既有结果并隐藏冲突推导：${[...hiddenConflicts].join('、')}。`);

function createSource(day, rowIndex, reference) {
  const dayStem = day[0];
  const dayBranch = day[1];
  const shift = (
    rowIndex - BRANCHES.indexOf(STEM_HOME[dayStem]) + BRANCHES.length
  ) % BRANCHES.length;
  const tianPan = Object.fromEntries(
    BRANCHES.map((_, index) => [String(index), BRANCHES[(index + shift) % BRANCHES.length]]),
  );
  const diPan = Object.fromEntries(BRANCHES.map((branch, index) => [String(index), branch]));
  const tianJiang = Object.fromEntries(BRANCHES.map((_, index) => [String(index), index === 0 ? '贵人' : '']));
  const skyAtGround = (branch) => tianPan[String(BRANCHES.indexOf(branch))];
  const ganYang = skyAtGround(STEM_HOME[dayStem]);
  const ganYing = skyAtGround(ganYang);
  const zhiYang = skyAtGround(dayBranch);
  const zhiYing = skyAtGround(zhiYang);

  return {
    dateInfo: {
      ganZhi: { day, hour: '甲子' },
      kongWang: [],
    },
    tianDiPan: { diPan, tianPan, tianJiang },
    siKe: {
      yiKe: [`${ganYang}${dayStem}`],
      erKe: [`${ganYing}${ganYang}`],
      sanKe: [`${zhiYang}${dayBranch}`],
      siKe: [`${zhiYing}${zhiYang}`],
    },
    sanChuan: {
      chu: [reference.干支组合[0]],
      zhong: [reference.干支组合[1]],
      mo: [reference.干支组合[2]],
      method: reference.格局,
    },
    keTi: {
      method: reference.格局,
      subTypes: [],
      extraTypes: [],
    },
    gongInfos: BRANCHES.map((branch) => ({
      tianZhi: branch,
      changSheng: '',
    })),
  };
}

function normalizeMethod(method) {
  if (method.includes('返吟') || method.includes('反吟')) return '反吟';
  if (method.includes('伏吟')) return '伏吟';
  if (method.includes('见机') || method.includes('察微') || method.includes('缀瑕')) return '涉害';
  if (method.includes('知一')) return '比用';
  return method;
}
