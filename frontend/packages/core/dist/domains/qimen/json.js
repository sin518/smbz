import { normalizeDetailLevelBinary } from '../../shared/render-utils.js';
function buildQimenPalaceStatusList(palace, dayKongPalaces, hourKongPalaces) {
    if (palace.palaceIndex === 5)
        return ['寄宫参看对应宫位'];
    return [
        dayKongPalaces.has(palace.palaceIndex) ? '日空' : null,
        hourKongPalaces.has(palace.palaceIndex) ? '时空' : null,
        palace.isYiMa ? '驿马' : null,
        palace.isRuMu ? '入墓' : null,
    ].filter((value) => !!value);
}
function buildQimenPalaceRef(result, index) {
    const palace = result.palaces[index - 1];
    return palace ? `${palace.palaceName}${index}` : String(index);
}
function formatStemCoordinate(pillar, referenceStem, palace, role) {
    const stem = pillar.charAt(0);
    if (!stem || !referenceStem || !palace)
        return undefined;
    return `${stem}${role}${stem === '甲' ? `，遁${referenceStem}` : ''}，天盘落${palace.palaceName}${palace.palaceIndex}宫`;
}
export function renderQimenCanonicalJSON(result, options = {}) {
    const detailLevel = normalizeDetailLevelBinary(options.detailLevel);
    const dunText = result.dunType === 'yang' ? '阳遁' : '阴遁';
    const basicInfo = {
        四柱: `${result.siZhu.year} ${result.siZhu.month} ${result.siZhu.day} ${result.siZhu.hour}`,
        节气: result.dateInfo.solarTerm,
        局式: `${dunText}${result.juNumber}局`,
        三元: result.yuan,
        旬首: result.xunShou,
        值符: result.zhiFu.star,
        值使: result.zhiShi.gate,
    };
    if (result.question)
        basicInfo.占问 = result.question;
    if (result.nianMing)
        basicInfo.年命 = result.nianMing;
    if (result.birthYearGanZhi)
        basicInfo.出生年干支 = result.birthYearGanZhi;
    if (result.nianMingReferenceStem)
        basicInfo.年命定位干 = result.nianMingReferenceStem;
    if (result.nianMingPalace) {
        basicInfo.年命宫 = `${result.nianMingPalace.palaceName}${result.nianMingPalace.palaceIndex}宫`;
    }
    const dayStemCoordinate = formatStemCoordinate(result.siZhu.day, result.dayStemReferenceStem, result.dayStemPalace, '日');
    const hourStemCoordinate = formatStemCoordinate(result.siZhu.hour, result.hourStemReferenceStem, result.hourStemPalace, '时');
    if (dayStemCoordinate)
        basicInfo.日干定位 = dayStemCoordinate;
    if (hourStemCoordinate)
        basicInfo.时干定位 = hourStemCoordinate;
    if (detailLevel === 'full') {
        if (result.birthYear)
            basicInfo.出生年份 = result.birthYear;
        basicInfo.公历 = result.dateInfo.solarDate;
        basicInfo.农历 = result.dateInfo.lunarDate;
        if (result.dateInfo.solarTermRange)
            basicInfo.节气范围 = result.dateInfo.solarTermRange;
        basicInfo.盘式 = result.panType;
        basicInfo.定局法 = result.juMethod;
    }
    const dayKongPalaces = new Set(result.kongWang.dayKong.palaces);
    const hourKongPalaces = new Set(result.kongWang.hourKong.palaces);
    const palaces = result.palaces.map((palace) => {
        const item = {
            宫名: palace.palaceName,
            宫位序号: palace.palaceIndex,
            宫位: `${palace.palaceName}${palace.palaceIndex}`,
            宫位五行: palace.element || '-',
            宫位地支: [...palace.branches],
            八神: palace.deity || '-',
            九星: palace.star || '-',
            ...(palace.starElement ? { 九星五行: palace.starElement } : {}),
            八门: palace.gate || '-',
            ...(palace.gateElement ? { 八门五行: palace.gateElement } : {}),
            天盘天干: palace.heavenStems?.join('、') || palace.heavenStem || '-',
            天盘长生: palace.heavenStemChangSheng.map((entry) => ({
                天盘干: entry.stem,
                地支状态: entry.stages.map(({ branch, stage }) => `${branch}${stage}`),
            })),
            地盘天干: palace.earthStem || '-',
            宫位状态: buildQimenPalaceStatusList(palace, dayKongPalaces, hourKongPalaces),
        };
        if (detailLevel === 'full') {
            item.方位 = palace.direction || '-';
            if (palace.formations.length > 0)
                item.格局 = [...palace.formations];
            if (palace.elementState)
                item.宫旺衰 = palace.elementState;
            if (palace.heavenStemElement)
                item.天盘天干五行 = palace.heavenStemElement;
            if (palace.earthStemElement)
                item.地盘天干五行 = palace.earthStemElement;
        }
        return item;
    });
    const json = {
        基本信息: basicInfo,
        九宫盘: palaces,
    };
    if (detailLevel === 'full') {
        json.空亡信息 = {
            日空: {
                地支: [...result.kongWang.dayKong.branches],
                宫位: result.kongWang.dayKong.palaces.map((index) => buildQimenPalaceRef(result, index)),
            },
            时空: {
                地支: [...result.kongWang.hourKong.branches],
                宫位: result.kongWang.hourKong.palaces.map((index) => buildQimenPalaceRef(result, index)),
            },
        };
        if (result.yiMa.branch && result.yiMa.palace) {
            json.驿马 = {
                地支: result.yiMa.branch,
                宫位: buildQimenPalaceRef(result, result.yiMa.palace),
            };
        }
        if (result.monthPhase && Object.keys(result.monthPhase).length > 0) {
            json.十干月令旺衰 = { ...result.monthPhase };
        }
        if (result.globalFormations.length > 0) {
            json.全局格局 = [...result.globalFormations];
        }
    }
    return json;
}
// ===== 大六壬 =====
