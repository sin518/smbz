import { deriveNineGate } from './derivation.js';
const DI_ZHI = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
const DAY_BRANCHES = new Set(['卯', '辰', '巳', '午', '未', '申']);
const FORWARD_GROUND_BRANCHES = new Set(['亥', '子', '丑', '寅', '卯', '辰']);
export function buildDaliurenAnalysisBasis(source) {
    return {
        guiRen: buildGuiRenBasis(source),
        transmission: buildTransmissionBasis(source),
        keyPatterns: buildKeyPatterns(source),
        timing: buildTimingAnalysis(source),
        limitations: [],
    };
}
function buildGuiRenBasis(source) {
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
function buildTransmissionBasis(source) {
    const method = source.keTi.method || source.sanChuan.method || '未取得';
    const initialBranch = source.sanChuan.chu[0] || '未取得';
    const derivation = deriveNineGate(source);
    const referenceTransmissions = [
        source.sanChuan.chu[0] || '',
        source.sanChuan.zhong[0] || '',
        source.sanChuan.mo[0] || '',
    ];
    const referenceMatch = (derivation.transmissions.every((branch, index) => branch === referenceTransmissions[index])
        && normalizeTransmissionMethod(derivation.method) === normalizeTransmissionMethod(method));
    return {
        method,
        initialBranch,
        steps: referenceMatch ? derivation.steps : [],
        harmDepth: referenceMatch ? derivation.harmDepth : null,
        basis: referenceMatch
            ? derivation.steps.map((step) => step.summary)
            : [],
        derivationComplete: referenceMatch,
        referenceMatch,
    };
}
function normalizeTransmissionMethod(method) {
    if (method.includes('返吟') || method.includes('反吟'))
        return '反吟';
    if (method.includes('伏吟'))
        return '伏吟';
    if (method.includes('见机') || method.includes('察微') || method.includes('缀瑕'))
        return '涉害';
    if (method.includes('知一'))
        return '比用';
    return method;
}
function buildKeyPatterns(source) {
    const patterns = [];
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
    const zhanGuan = detectZhanGuan(source);
    if (zhanGuan)
        patterns.push(zhanGuan);
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
function detectZhanGuan(source) {
    const dayStem = source.dateInfo.ganZhi.day[0] || '';
    const dayBranch = source.dateInfo.ganZhi.day[1] || '';
    const initialBranch = source.sanChuan.chu[0] || '';
    const directLessons = [
        { position: '日干', lesson: '一课', pair: source.siKe.yiKe[0] || '', expectedDown: dayStem },
        { position: '日支', lesson: '三课', pair: source.siKe.sanKe[0] || '', expectedDown: dayBranch },
    ];
    const match = directLessons.find(({ pair, expectedDown }) => ((pair[0] === '辰' || pair[0] === '戌')
        && pair[0] === initialBranch
        && pair[1] === expectedDown));
    if (!match)
        return null;
    const title = initialBranch === '辰' ? '天罡' : '天魁';
    return {
        name: '斩关',
        positions: [match.position, '初传'],
        basis: `${title}${initialBranch}临${match.position}，并由${match.lesson}发用，构成斩关`,
    };
}
function buildTimingAnalysis(source) {
    const grouped = groupTransmissionsByBranch(source);
    const clues = Array.from(grouped.entries()).slice(0, 3).map(([branch, roles]) => {
        const isEmpty = source.dateInfo.kongWang.includes(branch);
        return {
            branch,
            window: isEmpty
                ? `逢${branch}日／月填实，或待出旬后观察`
                : `逢${branch}日／月`,
            roles,
            basis: [
                `${roles.join('、')}为${branch}，逢值仅作为对应阶段的触发线索`,
                ...(isEmpty ? [
                    `日空为${source.dateInfo.kongWang.join('、')}，${branch}落空，须结合填实或出旬继续观察`,
                    '空亡只是条件修正，不代表填实后必成，也不直接换算公历日期',
                ] : []),
            ],
            kind: isEmpty ? 'conditional' : 'base',
        };
    });
    return {
        clues,
        note: '三传地支仅作为应期触发线索，须结合占事、课传角色、旺衰与反证判断机会、风险或变化性质。',
    };
}
function transmissionEntries(source) {
    return [
        { role: '初传', branch: source.sanChuan.chu[0] || '' },
        { role: '中传', branch: source.sanChuan.zhong[0] || '' },
        { role: '末传', branch: source.sanChuan.mo[0] || '' },
    ].filter((item) => item.branch);
}
function groupTransmissionsByBranch(source) {
    const grouped = new Map();
    for (const item of transmissionEntries(source)) {
        const roles = grouped.get(item.branch) || [];
        roles.push(item.role);
        grouped.set(item.branch, roles);
    }
    return grouped;
}
function findValueIndex(values, target) {
    const entry = Object.entries(values).find(([, value]) => value === target);
    const index = Number(entry?.[0] ?? 0);
    return Number.isInteger(index) && index >= 0 && index < DI_ZHI.length ? index : 0;
}
