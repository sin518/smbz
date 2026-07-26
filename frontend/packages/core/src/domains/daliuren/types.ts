/**
 * 大六壬 Core 类型定义
 */

// ===== 输入类型 =====

export interface DaliurenInput {
  /** 公历日期 YYYY-MM-DD */
  date: string;
  /** 小时 0-23 */
  hour: number;
  /** 分钟 0-59 */
  minute?: number;
  /** IANA 时区 */
  timezone?: string;
  /** 占事 */
  question?: string;
  /** 出生年（用于计算本命和行年） */
  birthYear?: number;
  /** 性别（用于计算行年） */
  gender?: 'male' | 'female';
  /** 应期分析方法；旧输入默认使用三传应期法 */
  timingMethod?: DaliurenTimingMethod;
}

// ===== 输出类型 =====

export type DaliurenTimingMethod = 'san-chuan' | 'kong-wang';

export interface DaliurenDateInfo {
  /** 公历日期时间 */
  solarDate: string;
  /** 农历日期 */
  lunarDate?: string;
  /** 四柱八字 */
  bazi: string;
  /** 四柱拆分 */
  ganZhi: {
    year: string;
    month: string;
    day: string;
    hour: string;
  };
  /** 月将地支 */
  yueJiang: string;
  /** 月将名 */
  yueJiangName: string;
  /** 旬 */
  xun: string;
  /** 空亡 */
  kongWang: [string, string];
  /** 驿马 */
  yiMa: string;
  /** 丁马 */
  dingMa: string;
  /** 天马 */
  tianMa: string;
  /** 昼/夜 */
  diurnal: boolean;
}

export interface DaliurenTianDiPan {
  /** 地盘 12 地支（子~亥） */
  diPan: Record<string, string>;
  /** 天盘 12 地支（子位~亥位上的天盘地支） */
  tianPan: Record<string, string>;
  /** 天将 12 位（子位~亥位上的天将） */
  tianJiang: Record<string, string>;
}

export interface DaliurenSiKe {
  /** 一课 [上神+下神, 天将] */
  yiKe: string[];
  /** 二课 */
  erKe: string[];
  /** 三课 */
  sanKe: string[];
  /** 四课 */
  siKe: string[];
}

export interface DaliurenSanChuan {
  /** 初传 [地支, 天将, 六亲, 遁干] */
  chu: string[];
  /** 中传 */
  zhong: string[];
  /** 末传 */
  mo: string[];
  /** 取传方法（大类） */
  method: string;
}

export interface DaliurenShenSha {
  name: string;
  value: string;
  description?: string;
}

/** 十二宫信息（用于天地盘宫格展示） */
export interface GongInfo {
  /** 地盘地支 */
  diZhi: string;
  /** 天盘地支 */
  tianZhi: string;
  /** 天将 */
  tianJiang: string;
  /** 天将简称 */
  tianJiangShort: string;
  /** 遁干 */
  dunGan: string;
  /** 十二长生 */
  changSheng: string;
  /** 天盘月将地支的五行 */
  wuXing: string;
  /** 天盘月将相对月令的旺衰状态 */
  wangShuai: '旺' | '相' | '休' | '囚' | '死';
  /** 旺衰的月令与五行关系依据 */
  wangShuaiBasis: string;
  /** 建除 */
  jianChu: string;
}

/** 课体信息 */
export interface KetiInfo {
  /** 取传课体（贼克/比用/涉害/遥克/昴星/伏吟/返吟/别责/八专） */
  method: string;
  /** 细分课体名（蒿失/弹射/元首/重审等） */
  subTypes: string[];
  /** 第二维度课体（三交/六仪/铸印等） */
  extraTypes: string[];
}

export interface DaliurenGuiRenBasis {
  /** 昼贵或夜贵 */
  dayNight: '昼贵' | '夜贵';
  /** 阳贵或阴贵 */
  yinYang: '阳贵' | '阴贵';
  /** 贵人所对应的天盘地支 */
  guiRenBranch: string;
  /** 贵人落临的地盘地支 */
  groundBranch: string;
  /** 十二天将的布列方向 */
  direction: '顺布' | '逆布';
  /** 可直接展示和交给 AI 的确定性依据 */
  basis: string[];
}

export interface DaliurenTransmissionBasis {
  /** 排盘库返回的取传课体 */
  method: string;
  /** 初传发用 */
  initialBranch: string;
  /** 当前库采用的可核验来源 */
  source: 'liuren-ts-lib@1.9.0课表';
  /** 可核验的匹配条件，不冒充完整九宗门推导 */
  basis: string[];
  /** 是否具备完整逐步推导 */
  derivationComplete: boolean;
}

export interface DaliurenKeyPattern {
  name: '伏吟' | '返吟' | '三传空亡' | '三传入墓';
  positions: string[];
  basis: string;
}

export interface DaliurenTimingCandidate {
  /** 条件地支，不直接冒充公历日期 */
  branch: string;
  /** 条件式时间表达 */
  window: string;
  /** 该候选在课盘中的角色 */
  roles: string[];
  /** 候选触发依据 */
  basis: string[];
  confidence: '中' | '低';
}

export interface DaliurenTimingAnalysis {
  method: DaliurenTimingMethod;
  label: '三传应期法' | '空亡填实法';
  applicable: boolean;
  candidates: DaliurenTimingCandidate[];
  note: string;
}

export interface DaliurenAnalysisBasis {
  guiRen: DaliurenGuiRenBasis;
  transmission: DaliurenTransmissionBasis;
  keyPatterns: DaliurenKeyPattern[];
  timing: DaliurenTimingAnalysis;
  /** 当前数据层明确不能可靠提供的项目 */
  limitations: string[];
}

export interface DaliurenOutput {
  /** 日期与基础信息 */
  dateInfo: DaliurenDateInfo;
  /** 天地盘 */
  tianDiPan: DaliurenTianDiPan;
  /** 四课 */
  siKe: DaliurenSiKe;
  /** 三传 */
  sanChuan: DaliurenSanChuan;
  /** 课体 */
  keTi: KetiInfo;
  /** 课名 */
  keName: string;
  /** 神煞 */
  shenSha: DaliurenShenSha[];
  /** 十二宫详情 */
  gongInfos: GongInfo[];
  /** 遁干表 */
  dunGan: Record<string, string>;
  /** 建除表 */
  jianChu: Record<string, string>;
  /** 本命干支 */
  benMing?: string;
  /** 行年干支 */
  xingNian?: string;
  /** 占事 */
  question?: string;
  /** 可核验的排盘依据、关键状态与应期候选 */
  analysisBasis: DaliurenAnalysisBasis;
}
