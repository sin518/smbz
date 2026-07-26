export interface QimenInput {
    year: number;
    month: number;
    day: number;
    hour: number;
    minute?: number;
    timezone?: string;
    question?: string;
    /** 求测主体公历出生年份，用于计算奇门年命天干 */
    birthYear?: number;
    panType?: 'zhuan';
    juMethod?: 'chaibu' | 'maoshan';
    zhiFuJiGong?: 'ji_liuyi' | 'ji_wugong';
}
export type QimenChangShengStage = '长生' | '沐浴' | '冠带' | '临官' | '帝旺' | '衰' | '病' | '死' | '墓' | '绝' | '胎' | '养';
export interface QimenHeavenStemChangSheng {
    stem: string;
    stages: Array<{
        branch: string;
        stage: QimenChangShengStage;
    }>;
}
export interface QimenPalaceInfo {
    palaceIndex: number;
    palaceName: string;
    direction: string;
    element: string;
    branches: string[];
    earthStem: string;
    heavenStem: string;
    heavenStems?: string[];
    heavenStemChangSheng: QimenHeavenStemChangSheng[];
    star: string;
    starElement: string;
    gate: string;
    gateElement: string;
    deity: string;
    formations: string[];
    stemWangShuai?: string;
    elementState?: string;
    earthStemElement?: string;
    heavenStemElement?: string;
    isKongWang?: boolean;
    isYiMa?: boolean;
    isRuMu?: boolean;
}
export interface QimenOutput {
    dateInfo: {
        solarDate: string;
        lunarDate: string;
        solarTerm: string;
        solarTermRange?: string;
    };
    siZhu: {
        year: string;
        month: string;
        day: string;
        hour: string;
    };
    dunType: 'yang' | 'yin';
    juNumber: number;
    yuan: string;
    xunShou: string;
    zhiFu: {
        star: string;
        palace: number;
    };
    zhiShi: {
        gate: string;
        palace: number;
    };
    palaces: QimenPalaceInfo[];
    kongWang: {
        dayKong: {
            branches: string[];
            palaces: number[];
        };
        hourKong: {
            branches: string[];
            palaces: number[];
        };
    };
    yiMa: {
        branch: string;
        palace: number;
    };
    globalFormations: string[];
    panType: string;
    juMethod: string;
    question?: string;
    /** 求测主体公历出生年份 */
    birthYear?: number;
    /** 公历出生年份直接换算的干支，不校正立春边界 */
    birthYearGanZhi?: string;
    /** 奇门年命天干 */
    nianMing?: string;
    /** 年命落宫使用的天盘定位干；甲命按出生年六甲遁干换算 */
    nianMingReferenceStem?: string;
    /** 天盘定位干所在的年命宫 */
    nianMingPalace?: {
        palaceIndex: number;
        palaceName: string;
    };
    /** 日干在天盘上的定位干；甲日按六甲遁干换算 */
    dayStemReferenceStem?: string;
    /** 日干定位干所在天盘宫 */
    dayStemPalace?: {
        palaceIndex: number;
        palaceName: string;
    };
    /** 时干在天盘上的定位干；甲时按六甲遁干换算 */
    hourStemReferenceStem?: string;
    /** 时干定位干所在天盘宫 */
    hourStemPalace?: {
        palaceIndex: number;
        palaceName: string;
    };
    monthPhase?: Record<string, string>;
}
//# sourceMappingURL=types.d.ts.map