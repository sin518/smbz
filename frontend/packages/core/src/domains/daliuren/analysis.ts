import type {
  DaliurenAnalysisBasis,
  DaliurenGuiRenBasis,
  DaliurenKeyPattern,
  DaliurenOutput,
  DaliurenTimingAnalysis,
  DaliurenTimingMethod,
  DaliurenTransmissionBasis,
} from './types.js';

const DI_ZHI = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'] as const;
const DAY_BRANCHES = new Set(['卯', '辰', '巳', '午', '未', '申']);
const FORWARD_GROUND_BRANCHES = new Set(['亥', '子', '丑', '寅', '卯', '辰']);

type AnalysisSource = Pick<
  DaliurenOutput,
  'dateInfo' | 'tianDiPan' | 'siKe' | 'sanChuan' | 'keTi' | 'gongInfos'
>;

export function buildDaliurenAnalysisBasis(
  source: AnalysisSource,
  timingMethod: DaliurenTimingMethod = 'san-chuan',
): DaliurenAnalysisBasis {
  return {
    guiRen: buildGuiRenBasis(source),
    transmission: buildTransmissionBasis(source),
    keyPatterns: buildKeyPatterns(source),
    timing: buildTimingAnalysis(source, timingMethod),
    limitations: [
      '当前排盘库只返回课表匹配后的三传与课体，未提供九宗门逐步推导和涉害层数，不作补算。',
      '斩关等扩展课格尚未经过规则来源与测试样本校验，当前不作判定。',
    ],
  };
}

function buildGuiRenBasis(source: AnalysisSource): DaliurenGuiRenBasis {
  const timeBranch = source.dateInfo.ganZhi.hour[1] || '';
  const dayStem = source.dateInfo.ganZhi.day[0] || '';
  const isDay = DAY_BRANCHES.has(timeBranch);
  const guiRenIndex = findValueIndex(source.tianDiPan.tianJiang, '贵人');
  const groundBranch = DI_ZHI[guiRenIndex] || '';
  const guiRenBranch = source.tianDiPan.tianPan[String(guiRenIndex)] || '';
  const direction = FORWARD_GROUND_BRANCHES.has(groundBranch) ? '顺布' : '逆布';
  const dayNight = isDay ? '昼贵' : '夜贵';
  const yinYang = isDay ? '阳贵' : '阴贵';

  return {
    dayNight,
    yinYang,
    guiRenBranch,
    groundBranch,
    direction,
    basis: [
      `时支${timeBranch || '未取得'}按卯至申为昼、酉至寅为夜，采用${dayNight}`,
      `日干${dayStem || '未取得'}取${yinYang}${guiRenBranch || '未取得'}`,
      `${guiRenBranch || '贵人'}临地盘${groundBranch || '未取得'}，十二天将${direction}`,
    ],
  };
}

function buildTransmissionBasis(source: AnalysisSource): DaliurenTransmissionBasis {
  const dayPillar = source.dateInfo.ganZhi.day || '未取得';
  const ganShang = source.siKe.yiKe[0]?.[0] || '未取得';
  const method = source.keTi.method || source.sanChuan.method || '未取得';
  const initialBranch = source.sanChuan.chu[0] || '未取得';

  return {
    method,
    initialBranch,
    source: 'liuren-ts-lib@1.9.0课表',
    basis: [
      `以${dayPillar}日、干上${ganShang}匹配现有排盘库课表`,
      `课表返回${method}课，初传发用为${initialBranch}`,
      '该依据可核验课表匹配结果，但不冒充完整九宗门逐步推导',
    ],
    derivationComplete: false,
  };
}

function buildKeyPatterns(source: AnalysisSource): DaliurenKeyPattern[] {
  const patterns: DaliurenKeyPattern[] = [];
  const method = source.keTi.method || source.sanChuan.method;

  if (method.includes('伏吟')) {
    patterns.push({
      name: '伏吟',
      positions: ['课体'],
      basis: `取传课体为${method}`,
    });
  }
  if (method.includes('返吟') || method.includes('反吟')) {
    patterns.push({
      name: '返吟',
      positions: ['课体'],
      basis: `取传课体为${method}`,
    });
  }

  const transmissions = transmissionEntries(source);
  const emptyPositions = transmissions
    .filter((item) => source.dateInfo.kongWang.includes(item.branch))
    .map((item) => item.role);
  if (emptyPositions.length > 0) {
    patterns.push({
      name: '三传空亡',
      positions: emptyPositions,
      basis: `日空为${source.dateInfo.kongWang.join('、')}，${emptyPositions.join('、')}落空`,
    });
  }

  const burialPositions = transmissions
    .filter((item) => source.gongInfos.find((gong) => gong.tianZhi === item.branch)?.changSheng === '墓')
    .map((item) => item.role);
  if (burialPositions.length > 0) {
    patterns.push({
      name: '三传入墓',
      positions: burialPositions,
      basis: `${burialPositions.join('、')}在日干十二长生中临墓`,
    });
  }

  return patterns;
}

function buildTimingAnalysis(
  source: AnalysisSource,
  timingMethod: DaliurenTimingMethod,
): DaliurenTimingAnalysis {
  if (timingMethod === 'kong-wang') {
    return buildKongWangTiming(source);
  }
  return buildSanChuanTiming(source);
}

function buildSanChuanTiming(source: AnalysisSource): DaliurenTimingAnalysis {
  const grouped = groupTransmissionsByBranch(source);
  const candidates = Array.from(grouped.entries()).slice(0, 3).map(([branch, roles]) => {
    const isEmpty = source.dateInfo.kongWang.includes(branch);
    return {
      branch,
      window: `逢${branch}日／月`,
      roles,
      basis: [
        `${roles.join('、')}为${branch}，逢值可作为事态触发窗口`,
        ...(isEmpty ? [`${branch}同时落日空，须结合出旬或填实，不直接按有利应期处理`] : []),
      ],
      confidence: isEmpty ? '低' as const : '中' as const,
    };
  });

  return {
    method: 'san-chuan',
    label: '三传应期法',
    applicable: candidates.length > 0,
    candidates,
    note: '候选只表示可能触发的地支条件，吉凶仍须结合占事、旺衰和课传角色判断。',
  };
}

function buildKongWangTiming(source: AnalysisSource): DaliurenTimingAnalysis {
  const grouped = groupTransmissionsByBranch(source);
  const candidates = Array.from(grouped.entries())
    .filter(([branch]) => source.dateInfo.kongWang.includes(branch))
    .slice(0, 3)
    .map(([branch, roles]) => ({
      branch,
      window: `逢${branch}日／月填实，或待出旬`,
      roles,
      basis: [
        `日空为${source.dateInfo.kongWang.join('、')}，${roles.join('、')}${branch}落空`,
        '以关键传爻填实或出旬作为条件候选，不直接换算公历日期',
      ],
      confidence: '中' as const,
    }));

  return {
    method: 'kong-wang',
    label: '空亡填实法',
    applicable: candidates.length > 0,
    candidates,
    note: candidates.length > 0
      ? '仅针对三传中的关键空亡给出填实或出旬条件。'
      : '本盘三传没有落入日空，空亡填实法不适用；建议改用三传应期法。',
  };
}

function transmissionEntries(source: AnalysisSource) {
  return [
    { role: '初传', branch: source.sanChuan.chu[0] || '' },
    { role: '中传', branch: source.sanChuan.zhong[0] || '' },
    { role: '末传', branch: source.sanChuan.mo[0] || '' },
  ].filter((item) => item.branch);
}

function groupTransmissionsByBranch(source: AnalysisSource) {
  const grouped = new Map<string, string[]>();
  for (const item of transmissionEntries(source)) {
    const roles = grouped.get(item.branch) || [];
    roles.push(item.role);
    grouped.set(item.branch, roles);
  }
  return grouped;
}

function findValueIndex(values: Record<string, string>, target: string) {
  const entry = Object.entries(values).find(([, value]) => value === target);
  const index = Number(entry?.[0] ?? 0);
  return Number.isInteger(index) && index >= 0 && index < DI_ZHI.length ? index : 0;
}
