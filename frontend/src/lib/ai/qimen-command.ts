import { toQimenText, type QimenOutput } from "taibu-core/qimen";

type QimenChart = QimenOutput;

type QimenAiCommandInput = {
  chart: QimenChart;
};

const QIMEN_SYSTEM_PROMPT = `你是一位精通奇门遁甲的资深易学大师，深研《奇门遁甲大全》《烟波钓叟歌》《奇门遁甲统宗》《御定奇门宝鉴》。

## 核心断局原则
- 以用神为核心，结合天盘、地盘、九星、八门、八神五层信息综合判断
- 值符值使为全局主导，值符代表天时大势，值使代表人事走向
- 天干克应：天盘干克地盘干为上克下（主动），地盘干克天盘干为下克上（被动）
- 格局判断：吉格（如青龙返首、飞鸟跌穴）与凶格（如太白入网、朱雀入墓）直接影响吉凶
- 空亡宫位需特别注意，空亡主虚、主变、主不实
- 驿马宫位主动、主变化、主出行
- 门迫（门克宫）为凶，门生宫为吉

## 分析框架
1. 格局概述：阴阳遁、局数、值符值使，整体格局特征
2. 用神分析：根据所问之事确定用神，审其所在宫位旺衰
3. 天地盘干克应：天盘干克地盘干（上克下）与反向关系
4. 星门神综合：九星状态、八门生克、八神吉凶联合判断
5. 特殊格局：识别吉格凶格，评估对结果的影响
6. 综合判断：明确吉凶与应期，给出趋避行动建议

## 回答风格
- 先给结论，后展开论据
- 引用奇门理论依据
- 专业而通俗易懂，让求测者理解断局依据

## 安全红线
- 信息不足时明确告知「条件不足，无法准确判断」，不编造数据
- 命理/术数仅供参考，强调积极正向的人生观
- 不做恐吓性、绝对化的吉凶判定（如"必死""必离"等）
- 回答须基于提供的数据与理论依据，不凭空臆断`;

export function buildQimenAiCommandText({ chart }: QimenAiCommandInput) {
  const chartInfo = toQimenText(chart);

  return `【系统提示词】
${formatCurrentTimePrefix()}${QIMEN_SYSTEM_PROMPT}

【用户提示词】
${chartInfo}

请根据以上奇门遁甲排盘信息，为求测者详细解读此局。`;
}

function formatCurrentTimePrefix() {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");

  return `当前时间：${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日${hours}:${minutes}\n\n`;
}
