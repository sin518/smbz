const BRANCHES = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
const YANG = new Set(['甲', '丙', '戊', '庚', '壬', '子', '寅', '辰', '午', '申', '戌']);
const MENG = new Set(['寅', '巳', '申', '亥']);
const ZHONG = new Set(['子', '卯', '午', '酉']);
const STEM_HOME = {
    甲: '寅', 乙: '辰', 丙: '巳', 丁: '未', 戊: '巳',
    己: '未', 庚: '申', 辛: '戌', 壬: '亥', 癸: '丑',
};
const FIVE_ELEMENT = {
    甲: '木', 乙: '木', 寅: '木', 卯: '木',
    丙: '火', 丁: '火', 巳: '火', 午: '火',
    戊: '土', 己: '土', 辰: '土', 戌: '土', 丑: '土', 未: '土',
    庚: '金', 辛: '金', 申: '金', 酉: '金',
    壬: '水', 癸: '水', 亥: '水', 子: '水',
};
const CONTROLS = {
    木: '土',
    火: '金',
    土: '水',
    金: '木',
    水: '火',
};
const PALACE_HIDDEN_ELEMENTS = {
    亥: ['水', '水'],
    子: ['水'],
    丑: ['土', '水'],
    寅: ['木', '木'],
    卯: ['木'],
    辰: ['土', '木'],
    巳: ['火', '火', '土'],
    午: ['火'],
    未: ['土', '火', '土'],
    申: ['金', '金'],
    酉: ['金'],
    戌: ['土', '金'],
};
const STEM_COMBINATION = {
    甲: '己', 乙: '庚', 丙: '辛', 丁: '壬', 戊: '癸',
    己: '甲', 庚: '乙', 辛: '丙', 壬: '丁', 癸: '戊',
};
const THREE_HARMONY_FORWARD = {
    申: '子', 子: '辰', 辰: '申',
    亥: '卯', 卯: '未', 未: '亥',
    寅: '午', 午: '戌', 戌: '寅',
    巳: '酉', 酉: '丑', 丑: '巳',
};
const HORSE = {
    寅: '申', 午: '申', 戌: '申',
    申: '寅', 子: '寅', 辰: '寅',
    亥: '巳', 卯: '巳', 未: '巳',
    巳: '亥', 酉: '亥', 丑: '亥',
};
const PUNISHMENT = {
    子: '卯', 卯: '子',
    寅: '巳', 巳: '申', 申: '寅',
    丑: '戌', 戌: '未', 未: '丑',
    辰: '辰', 午: '午', 酉: '酉', 亥: '亥',
};
const OPPOSITE = {
    子: '午', 丑: '未', 寅: '申', 卯: '酉', 辰: '戌', 巳: '亥',
    午: '子', 未: '丑', 申: '寅', 酉: '卯', 戌: '辰', 亥: '巳',
};
const LESSON_LABELS = ['一课', '二课', '三课', '四课'];
export function deriveNineGate(source) {
    const dayGan = source.dateInfo.ganZhi.day[0] || '';
    const dayZhi = source.dateInfo.ganZhi.day[1] || '';
    const lessons = buildLessons(source);
    const uniqueLessonCount = new Set(lessons.map((lesson) => lesson.up)).size;
    const lowerControlsUpper = uniqueCandidates(lessons, '下克上');
    const upperControlsLower = uniqueCandidates(lessons, '上克下');
    const hasDirectControl = lowerControlsUpper.length + upperControlsLower.length > 0;
    const overlap = skyAtGround(source, '子') === '子';
    const reverse = skyAtGround(source, '子') === '午';
    const steps = [];
    let directInitial = '';
    let directMethod = '';
    const priorityCandidates = lowerControlsUpper.length > 0 ? lowerControlsUpper : upperControlsLower;
    if (hasDirectControl) {
        if (lowerControlsUpper.length === 1) {
            directInitial = lowerControlsUpper[0].lesson.up;
            directMethod = reverse ? '反吟' : '重审';
            steps.push(step('贼克', `四课仅一处下克上，取受克的${directInitial}发用`, lowerControlsUpper));
        }
        else if (lowerControlsUpper.length === 0 && upperControlsLower.length === 1) {
            directInitial = upperControlsLower[0].lesson.up;
            directMethod = '元首';
            steps.push(step('贼克', `四课无下克上，仅一处上克下，取${directInitial}发用`, upperControlsLower));
        }
        else {
            steps.push(step('贼克', `${priorityCandidates.length}个${priorityCandidates[0]?.relation || '克贼'}候选，进入比用裁决`, priorityCandidates));
            const parityMatches = priorityCandidates.filter((candidate) => isYang(candidate.lesson.up) === isYang(dayGan));
            if (parityMatches.length === 1) {
                directInitial = parityMatches[0].lesson.up;
                directMethod = '比用';
                steps.push(step('比用', `${dayGan}日取与日干阴阳相同的${directInitial}发用`, parityMatches));
            }
            else {
                const harmCandidates = parityMatches.length > 1 ? parityMatches : priorityCandidates;
                steps.push(step('比用', parityMatches.length > 1
                    ? '同类候选仍有多个，进入涉害深浅比较'
                    : '候选俱不比，进入涉害深浅比较', harmCandidates));
                const harm = deriveHarmDepth(source, harmCandidates, dayGan);
                if (harm.selected) {
                    const harmStep = makeStep('涉害', harm.depth.decision, harmCandidates.map((candidate) => candidate.lesson.up));
                    steps.push(harmStep);
                    if (!overlap) {
                        if (reverse) {
                            steps.push(makeStep('反吟', '天地盘相冲，有克仍按前述克贼、比用和涉害结果发用', [harm.selected]));
                            return finishNormal(source, harm.selected, '反吟', '反吟', steps, harm.depth);
                        }
                        return finishNormal(source, harm.selected, harm.depth.subtype, '涉害', steps, harm.depth);
                    }
                    directInitial = harm.selected;
                    directMethod = harm.depth.subtype;
                }
            }
        }
    }
    if (overlap) {
        steps.unshift(makeStep('伏吟', '天盘与地盘同位，按伏吟法定三传', []));
        return deriveOverlap(source, directInitial, hasDirectControl, steps);
    }
    if (directInitial) {
        if (reverse) {
            steps.push(makeStep('反吟', '天地盘相冲，有克仍按前述克贼或比用结果发用', [directInitial]));
            return finishNormal(source, directInitial, '反吟', '反吟', steps, null);
        }
        return finishNormal(source, directInitial, directMethod, directMethod === '比用' ? '比用' : '贼克', steps, null);
    }
    if (reverse && !hasDirectControl) {
        const transmissions = [
            HORSE[dayZhi] || '',
            lessons[2]?.up || '',
            lessons[0]?.up || '',
        ];
        steps.push(makeStep('反吟', `天地盘相冲且四课无克，取日支驿马${transmissions[0]}发用`, [transmissions[0]]));
        return { method: '反吟', gate: '反吟', transmissions, steps, harmDepth: null };
    }
    if (uniqueLessonCount === 2) {
        const yangDay = isYang(dayGan);
        const initial = yangDay
            ? skyAtGround(source, offsetBranch(STEM_HOME[dayGan], 2))
            : offsetBranch(lessons[3].up, -2);
        const transmissions = [initial, lessons[0].up, lessons[0].up];
        steps.push(makeStep('八专', `${yangDay ? '阳日顺数' : '阴日逆数'}三位取${initial}发用，中末传同取干上${lessons[0].up}`, [initial]));
        return { method: '八专', gate: '八专', transmissions, steps, harmDepth: null };
    }
    if (uniqueLessonCount === 3 || uniqueLessonCount === 4) {
        const remoteControlsDay = uniqueByBranch(lessons.slice(1)
            .filter((lesson) => controls(FIVE_ELEMENT[lesson.up], FIVE_ELEMENT[dayGan]))
            .map((lesson) => ({ lesson, relation: '上克下' })));
        const dayControlsRemote = uniqueByBranch(lessons.slice(1)
            .filter((lesson) => controls(FIVE_ELEMENT[dayGan], FIVE_ELEMENT[lesson.up]))
            .map((lesson) => ({ lesson, relation: '下克上' })));
        const remote = selectByParity(remoteControlsDay, dayGan) || selectByParity(dayControlsRemote, dayGan);
        if (remote) {
            const subtype = remoteControlsDay.some((candidate) => candidate.lesson.up === remote.lesson.up)
                ? '蒿矢'
                : '弹射';
            steps.push(makeStep('遥克', `${subtype}：${remote.lesson.up}${subtype === '蒿矢' ? '遥克日干' : '受日干遥克'}，取其发用`, [remote.lesson.up]));
            return finishNormal(source, remote.lesson.up, '遥克', '遥克', steps, null);
        }
    }
    if (uniqueLessonCount === 4) {
        const yangDay = isYang(dayGan);
        const transmissions = yangDay
            ? [
                skyAtGround(source, '酉'),
                lessons[2].up,
                lessons[0].up,
            ]
            : [
                groundUnderSky(source, '酉'),
                lessons[0].up,
                lessons[2].up,
            ];
        steps.push(makeStep('昴星', `${yangDay ? '阳日虎视' : '阴日冬蛇掩目'}，取${transmissions[0]}发用`, [transmissions[0]]));
        return { method: '昴星', gate: '昴星', transmissions, steps, harmDepth: null };
    }
    if (uniqueLessonCount === 3) {
        const yangDay = isYang(dayGan);
        const initial = yangDay
            ? skyAtGround(source, STEM_HOME[STEM_COMBINATION[dayGan]])
            : THREE_HARMONY_FORWARD[dayZhi] || '';
        const transmissions = [initial, lessons[0].up, lessons[0].up];
        steps.push(makeStep('别责', `${yangDay ? '阳日取日干五合寄宫上神' : '阴日取日支三合前神'}${initial}发用，中末传同取干上${lessons[0].up}`, [initial]));
        return { method: '别责', gate: '别责', transmissions, steps, harmDepth: null };
    }
    return {
        method: source.keTi.method || source.sanChuan.method || '未取得',
        gate: normalizeGate(source.keTi.method || source.sanChuan.method),
        transmissions: [
            source.sanChuan.chu[0] || '',
            source.sanChuan.zhong[0] || '',
            source.sanChuan.mo[0] || '',
        ],
        steps,
        harmDepth: null,
    };
}
function deriveOverlap(source, directInitial, hasDirectControl, steps) {
    const lessons = buildLessons(source);
    const dayGan = source.dateInfo.ganZhi.day[0] || '';
    const initial = hasDirectControl ? directInitial : (isYang(dayGan) ? lessons[0].up : lessons[2].up);
    let middle = PUNISHMENT[initial] || '';
    if (middle === initial) {
        middle = hasDirectControl ? lessons[2].up : (isYang(dayGan) ? lessons[2].up : lessons[0].up);
    }
    let final = PUNISHMENT[middle] || '';
    if (final === middle || final === initial)
        final = OPPOSITE[middle] || '';
    const transmissions = [initial, middle, final];
    steps.push(makeStep('伏吟', `${hasDirectControl ? '有克先取克贼发用' : `${isYang(dayGan) ? '阳日取干上' : '阴日取支上'}发用`}，中末传依刑、冲递取`, transmissions));
    return { method: '伏吟', gate: '伏吟', transmissions, steps, harmDepth: null };
}
function deriveHarmDepth(source, candidates, dayGan) {
    const analyses = candidates.map((candidate) => buildHarmCandidate(source, candidate));
    const maxDepth = Math.max(...analyses.map((candidate) => candidate.depth));
    let tied = [...analyses];
    let subtype = '涉害';
    let decision = `比较涉害深浅：${formatDepths(analyses)}`;
    const meng = tied.filter((candidate) => MENG.has(candidate.groundBranch));
    if (meng.length === 1) {
        tied = meng;
        subtype = '见机';
        decision += `；按孟仲裁决，取临地盘四孟的${tied[0].branch}发用，定为见机`;
    }
    else {
        const pool = meng.length > 1 ? meng : tied;
        const zhong = pool.filter((candidate) => ZHONG.has(candidate.groundBranch));
        if (zhong.length === 1) {
            tied = zhong;
            subtype = '察微';
            decision += `；无唯一孟神，取临地盘四仲的${tied[0].branch}发用，定为察微`;
        }
        else if (meng.length > 1 || zhong.length > 1 || pool.length > 1) {
            const finalPool = zhong.length > 1 ? zhong : pool;
            const preferredLessons = isYang(dayGan) ? new Set([0, 1]) : new Set([2, 3]);
            tied = [
                finalPool.find((candidate) => {
                    const lessonIndex = LESSON_LABELS.indexOf(candidate.lesson);
                    return preferredLessons.has(lessonIndex);
                }) || finalPool[0],
            ];
            subtype = '缀瑕';
            decision += `；孟仲仍同，${isYang(dayGan) ? '阳日取干上两课先见' : '阴日取支上两课先见'}的${tied[0].branch}发用，定为缀瑕`;
        }
        else {
            tied = analyses.filter((candidate) => candidate.depth === maxDepth);
            decision += `；取受克最深的${tied[0]?.branch || ''}发用`;
        }
    }
    const selected = tied[0]?.branch || '';
    const selectedCandidates = analyses.map((candidate) => ({
        ...candidate,
        selected: candidate.branch === selected,
    }));
    return {
        selected,
        depth: {
            subtype,
            candidates: selectedCandidates,
            decision,
        },
    };
}
function buildHarmCandidate(source, candidate) {
    const branch = candidate.lesson.up;
    const start = groundUnderSky(source, branch);
    const path = [];
    let ground = start;
    for (let stepIndex = 0; stepIndex < BRANCHES.length; stepIndex += 1) {
        const hiddenElements = PALACE_HIDDEN_ELEMENTS[ground] || [];
        const branchElement = FIVE_ELEMENT[branch];
        const hitCount = hiddenElements.filter((hiddenElement) => (candidate.relation === '下克上'
            ? controls(hiddenElement, branchElement)
            : controls(branchElement, hiddenElement))).length;
        path.push({ groundBranch: ground, hiddenElements: [...hiddenElements], hitCount });
        if (ground === branch)
            break;
        ground = offsetBranch(ground, 1);
    }
    return {
        lesson: candidate.lesson.label,
        branch,
        relation: candidate.relation,
        groundBranch: start,
        depth: path.reduce((sum, segment) => sum + segment.hitCount, 0),
        path,
        selected: false,
    };
}
function buildLessons(source) {
    const values = [source.siKe.yiKe, source.siKe.erKe, source.siKe.sanKe, source.siKe.siKe];
    return values.map((lesson, index) => ({
        label: LESSON_LABELS[index],
        index,
        up: lesson[0]?.[0] || '',
        down: lesson[0]?.[1] || '',
    }));
}
function uniqueCandidates(lessons, relation) {
    const matches = lessons.filter((lesson) => (relation === '下克上'
        ? controls(FIVE_ELEMENT[lesson.down], FIVE_ELEMENT[lesson.up])
        : controls(FIVE_ELEMENT[lesson.up], FIVE_ELEMENT[lesson.down]))).map((lesson) => ({ lesson, relation }));
    return uniqueByBranch(matches);
}
function uniqueByBranch(candidates) {
    const result = [];
    for (const candidate of candidates) {
        if (!result.some((item) => item.lesson.up === candidate.lesson.up))
            result.push(candidate);
    }
    return result;
}
function selectByParity(candidates, dayGan) {
    if (candidates.length === 1)
        return candidates[0];
    return candidates.find((candidate) => isYang(candidate.lesson.up) === isYang(dayGan));
}
function finishNormal(source, initial, method, gate, steps, harmDepth) {
    const middle = skyAtGround(source, initial);
    const final = skyAtGround(source, middle);
    steps.push(makeStep(gate, `初传${initial}，依次取其上神为中传${middle}、末传${final}`, [initial, middle, final]));
    return { method, gate, transmissions: [initial, middle, final], steps, harmDepth };
}
function step(gate, summary, candidates) {
    return makeStep(gate, summary, candidates.map((candidate) => `${candidate.lesson.label}${candidate.lesson.up}`));
}
function makeStep(gate, summary, candidates) {
    return { gate, summary, candidates };
}
function skyAtGround(source, branch) {
    const index = BRANCHES.indexOf(branch);
    return index >= 0 ? source.tianDiPan.tianPan[String(index)] || '' : '';
}
function groundUnderSky(source, branch) {
    const entry = Object.entries(source.tianDiPan.tianPan).find(([, sky]) => sky === branch);
    const index = Number(entry?.[0] ?? -1);
    return Number.isInteger(index) && index >= 0 ? BRANCHES[index] || '' : '';
}
function offsetBranch(branch, offset) {
    const index = BRANCHES.indexOf(branch);
    if (index < 0)
        return '';
    return BRANCHES[(index + offset + BRANCHES.length) % BRANCHES.length];
}
function controls(sourceElement = '', targetElement = '') {
    return CONTROLS[sourceElement] === targetElement;
}
function isYang(value) {
    return YANG.has(value);
}
function formatDepths(candidates) {
    return candidates.map((candidate) => `${candidate.branch}${candidate.depth}重`).join('、');
}
function normalizeGate(method) {
    if (method.includes('伏吟'))
        return '伏吟';
    if (method.includes('返吟') || method.includes('反吟'))
        return '反吟';
    if (method.includes('八专'))
        return '八专';
    if (method.includes('别责'))
        return '别责';
    if (method.includes('昴星'))
        return '昴星';
    if (method.includes('遥克') || method.includes('蒿矢') || method.includes('弹射'))
        return '遥克';
    if (method.includes('涉害') || method.includes('见机') || method.includes('察微') || method.includes('缀瑕'))
        return '涉害';
    if (method.includes('比用') || method.includes('知一'))
        return '比用';
    return '贼克';
}
