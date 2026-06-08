import { toQimenText, type QimenOutput } from "taibu-core/qimen";

type QimenChart = QimenOutput;

type QimenAiCommandInput = {
  chart: QimenChart;
};

const PALACE_PROMPT_ORDER = [
  { index: 6, label: "乾宫" },
  { index: 1, label: "坎宫" },
  { index: 8, label: "艮宫" },
  { index: 3, label: "震宫" },
  { index: 4, label: "巽宫" },
  { index: 9, label: "离宫" },
  { index: 2, label: "坤宫" },
  { index: 7, label: "兑宫" },
] as const;

function buildQimenSystemPrompt(chart: QimenChart) {
  const topic = buildTopic(chart);
  const question = chart.question?.trim() || topic;
  const dayStem = getStemFromPillar(chart.siZhu.day);
  const hourStem = getStemFromPillar(chart.siZhu.hour);

  return `
你是一位精通奇门遁甲的命理分析师，请根据我提供的奇门盘信息，输出一份「奇门遁甲财运详解」。

## 安全红线（必须遵守）
1. 信息不足时明确告知「条件不足，无法准确判断」，不编造数据。
2. 命理术数仅供参考；在准确判断吉凶的基础上，以客观态度输出，**不得因“正能量”“正向引导”而回避或弱化凶的判断**。若结果为凶，直言其凶。允许使用“大凶”“凶”“无解”“难成”“破财难免”“不宜行动”等古典或直白术语。
3. 不做恐吓性、绝对化的吉凶判定（如“必死”“必破产”等）。
4. 禁止恐吓、宿命论、医疗/投资/法律保证、玄学化解和付费引导。
5. 回答须基于提供的盘面信息与奇门理论依据，不凭空臆断。

## 输出分析强制顺序（先论凶，后论吉）
- **第一步：排查全局凶兆**（反吟、伏吟、五不遇时、时干入墓、值符值使空亡门迫等）。若有，先断其凶。
- **第二步：排查用神宫凶兆**（生门宫空亡、门迫、逢凶格、天蓬/天柱/天芮等凶星临宫）。若有，直接判凶。
- **第三步：排查自身凶兆**（日干空亡、入墓、受克、逢死门/惊门/白虎等）。若有，直言“自身有损，求财反灾”。
- **第四步：排查生克凶兆**（财克身、身弱不胜财、时干克日干）。若有，直言“财来害身”或“事与愿违”。
- **仅当以上均无明显凶兆时，方可进入吉兆判断**。

请严格按照以下结构分析，语言风格要**专业、直接、细致**，有直断结论，也要有用神、宫位、格局、星门神、空亡、应期和行动建议。

主题：
奇门遁甲财运详解：${topic}

用户问题：
${question}

盘面信息：
- 日干：${dayStem}（日柱 ${chart.siZhu.day}，代表求测者自身）
- 时干：${hourStem}（时柱 ${chart.siZhu.hour}，代表所问之事）
- 值符：${formatZhiFu(chart)}
- 值使：${formatZhiShi(chart)}
- 空亡：${formatKongWang(chart)}
- 马星：${formatYiMa(chart)}
- 各宫信息：
${formatPalacePromptLines(chart)}

请输出以下内容：

一、开头标题
格式为：
奇门遁甲财运详解：${topic}

二、直断结论
先用一段话直接判断整体财运趋势，**必须优先指出凶险，后谈机会（如有）**。
必须包含：
- 总体吉凶判断（若为凶，用“大凶”“凶”“平中带凶”等，不得用“注意”“谨慎”模糊替代）
- 财运机会大小（若无机会，直接说“机会渺茫”）
- 风险来源（具体指出哪个宫位、哪个格局导致）
- 是否适合投资、合作、扩张、借贷、跳槽或创业（若不适合，直接说“强烈不建议”）
- 用一句总结格局，例如：“财旺身弱，得而复失”“凶多吉少，守成为上”“大凶无解，切忌妄动”“先难后易，晚运可期”

三、重复用户问题
格式：
${question}

四、用神定位与核心格局分析

1. 用神选取
请说明：
- 财运首要用神：优先看生门，落在哪一宫
- 自身用神：日干落在哪一宫
- 事体用神：时干落在哪一宫
- 如涉及投资、合作、工作收入、偏财，可补充对应参考用神

2. 财运核心宫位分析
围绕生门所在宫分析：
- 宫位五行
- 门、星、神、天盘干、地盘干
- 是否有吉门、吉星、凶神、凶格
- 天地盘干形成的格局和古法含义
- **若逢空亡、门迫、凶格（如庚加癸、癸加庚、辛加乙、白虎猖狂、朱雀投江等），直接判为“财运凶，破财或求财无门”，并说明具体破财方式**
- 对财运的具体影响，例如赚钱方式、风险、阻碍、破财点、收益稳定性

3. 自身状态分析
围绕日干所在宫分析：
- 自身能力、心态、行动力
- **是否空亡、入墓、受克、逢凶门凶星。若日干空亡，直言“自身迷茫，无力求财”；若逢死门、白虎，直言“身心俱疲，强求有灾”**
- 是否有值符、九天、六合等助力
- 自身是否能承接财运：**若日干休囚受克，直接说“身弱不胜财，得财也会破掉”**
- 对财运成败的影响

五、事体与时空互动

1. 事体宫位
分析时干所在宫，说明这件求财之事本身是否顺利。
重点判断：
- 是否与财运宫同宫
- 是否受克、空亡、入墓
- 是否形成凶格或吉格
- 事情是否真实、可落地、可持续
- **若时干空亡或逢凶格，直言“此事虚而不实，求之无益”**

2. 生克关系决定吉凶
分析：
- 财运宫与日干宫的生克
- 时干宫与日干宫的生克
- 门、星、神之间的辅助判断
- 是“财来生我”“我去求财”“财克身”“身弱不胜财”还是“比和相助”
- **若财宫克日干宫，直接说“财来克身，求财反招灾祸”**
- **若日干宫克财宫，直接说“强求之财，劳而无功”**
- 如果表面吉、实际凶，要指出原因，**且优先说出凶的原因**

六、特殊格局与应期提醒

请结合盘面分析：
- 空亡：**若用神宫空亡，且无填实冲实之象，直接说“事空不成，应期在填实之时，但填实也可能应凶”**
- 入墓：**用神入墓，断“财被锁住，难以取出”**
- 驿马：**临驿马且为凶，断“奔波破财”**
- 反吟、伏吟：**反吟主反复失败，伏吟主停滞无成，均判凶**
- 三奇入墓、六仪击刑、门迫：**门迫直接判“事有阻碍，强行招灾”**
- 凶格（庚加癸、癸加庚、辛加乙等）：**直接判凶，并说明古法含义**
- 吉格（三奇得使、青龙返首等）：**仅当用神宫无凶兆时才论吉**

应期部分请说明：
- **若全局为凶，直接写“此事不宜进行，无有利应期”或“若强行操作，应期在X月（逢凶格填实之时），届时必有损失”**
- 若为吉或平，可说明哪些月份、节气或地支时间财运事件更明显
- 哪些时间适合行动
- 哪些时间风险最大
- 如果有空亡填实、冲动宫位、马星发动，也要说明

七、行动与趋避建议

请给出具体建议，分为以下几类。**若盘面为凶，则大部分建议应为“不宜”“避免”“放弃”，不得给出“可以谨慎尝试”等虚假希望。**

1. 财务策略
- 若凶：直接说“只进不出，暂停一切投资，削减开支，预留现金”
- 若吉：给出守财、投资、杠杆等建议

2. 工作与事业
- 若凶：说“不宜跳槽、不宜创业、稳守现有岗位，避免冲突”
- 若吉：说“可争取升职、跳槽、拓展”

3. 合作与投资
- **若凶：直接说“严禁合伙、禁止借贷、禁止担保、禁止创业扩张”**
- 若吉：可给出合作方向

4. 健康与情绪
- 如果日干宫有死门、天芮、白虎、空亡等，要提醒健康、压力、过劳、冲动决策，**并直接说“当前状态不适合做重大财务决策”**

5. 方位建议
- 结合有利宫位或日干宫，给出可参考的求助方位、行动方位或避险方位。**若全局为凶，可写“无有利方位，宜静不宜动”**

八、整体风格要求
- **先凶后吉，不得颠倒顺序。**
- 不要只说吉凶，要解释为什么。
- 语言要像专业命理师直断，不要太含糊。
- 可以引用古法格局，但引用后必须翻译成现代含义。
- 结论要清楚，建议要可执行。
- **如果盘面凶，要直接说明风险，使用“大凶”“无解”“破财”“不宜”“禁止”等词汇，不要用“注意”“谨慎”“可能”来弱化。**
- 如果凶中有吉，要说明吉在哪里、如何用，但不得掩盖凶的主导地位。
- 不要编造盘面中没有的信息。
`;
}

export function buildQimenAiCommandText({ chart }: QimenAiCommandInput) {
  const chartInfo = toQimenText(chart);

  return `【系统提示词】
${formatCurrentTimePrefix()}${buildQimenSystemPrompt(chart)}

【用户提示词】
${chartInfo}

请根据以上奇门遁甲排盘信息，为求测者详细解读此局。`;
}

function buildTopic(chart: QimenChart) {
  const question = chart.question?.trim();
  if (!question) {
    return "财运分析";
  }

  return question.includes("财") ||
    question.includes("钱") ||
    question.includes("收入")
    ? question
    : `${question}财运分析`;
}

function getStemFromPillar(pillar: string) {
  return pillar.trim().charAt(0) || "-";
}

function formatZhiFu(chart: QimenChart) {
  const palace = getPalace(chart, chart.zhiFu.palace);
  return `${chart.zhiFu.star || "-"}落${formatPalaceName(palace, chart.zhiFu.palace)}`;
}

function formatZhiShi(chart: QimenChart) {
  const palace = getPalace(chart, chart.zhiShi.palace);
  return `${chart.zhiShi.gate || "-"}落${formatPalaceName(palace, chart.zhiShi.palace)}`;
}

function formatKongWang(chart: QimenChart) {
  const dayKong = formatKongWangPart(
    chart,
    chart.kongWang.dayKong.branches,
    chart.kongWang.dayKong.palaces,
  );
  const hourKong = formatKongWangPart(
    chart,
    chart.kongWang.hourKong.branches,
    chart.kongWang.hourKong.palaces,
  );
  return `日空 ${dayKong}；时空 ${hourKong}`;
}

function formatKongWangPart(
  chart: QimenChart,
  branches: string[],
  palaces: number[],
) {
  const branchText = branches.length ? branches.join("、") : "-";
  const palaceText = palaces.length
    ? palaces
        .map((index) => formatPalaceName(getPalace(chart, index), index))
        .join("、")
    : "-";
  return `${branchText}（${palaceText}）`;
}

function formatYiMa(chart: QimenChart) {
  const palace = getPalace(chart, chart.yiMa.palace);
  return `${chart.yiMa.branch || "-"}${chart.yiMa.palace ? `（${formatPalaceName(palace, chart.yiMa.palace)}）` : ""}`;
}

function formatPalacePromptLines(chart: QimenChart) {
  return PALACE_PROMPT_ORDER.map(({ index, label }, orderIndex) => {
    const palace = getPalace(chart, index);
    return `  ${orderIndex + 1}. ${label}：${formatPalaceDetail(chart, palace, index)}`;
  }).join("\n");
}

function formatPalaceDetail(
  chart: QimenChart,
  palace: QimenChart["palaces"][number] | undefined,
  fallbackIndex: number,
) {
  if (!palace) {
    return `未取得${fallbackIndex}宫数据`;
  }

  const star = palace.star
    ? `${palace.star}${formatBracket(palace.starElement)}`
    : "-";
  const gate = palace.gate
    ? `${palace.gate}${formatBracket(palace.gateElement)}`
    : "-";
  const state = formatPalaceState(chart, palace);
  const formations = palace.formations.length
    ? palace.formations.join("、")
    : "-";

  return [
    `${palace.palaceName}${palace.palaceIndex}宫`,
    `方位${palace.direction || "-"}`,
    `宫五行${palace.element || "-"}`,
    `八神${palace.deity || "-"}`,
    `九星${star}`,
    `八门${gate}`,
    `天盘${palace.heavenStem || "-"}`,
    `地盘${palace.earthStem || "-"}`,
    `状态${state}`,
    `格局${formations}`,
  ].join("，");
}

function formatPalaceState(
  chart: QimenChart,
  palace: QimenChart["palaces"][number],
) {
  const states = [
    chart.kongWang.dayKong.palaces.includes(palace.palaceIndex) ? "日空" : null,
    chart.kongWang.hourKong.palaces.includes(palace.palaceIndex)
      ? "时空"
      : null,
    palace.isYiMa ? "驿马" : null,
    palace.isRuMu ? "入墓" : null,
    palace.stemWangShuai ? `天干${palace.stemWangShuai}` : null,
    palace.elementState ? `宫${palace.elementState}` : null,
  ].filter((item): item is string => Boolean(item));

  return states.length ? states.join("、") : "-";
}

function formatBracket(value: string | undefined) {
  return value ? `（${value}）` : "";
}

function formatPalaceName(
  palace: QimenChart["palaces"][number] | undefined,
  fallbackIndex: number,
) {
  return `${palace?.palaceName || ""}${fallbackIndex}宫`;
}

function getPalace(chart: QimenChart, palaceIndex: number) {
  return chart.palaces.find((palace) => palace.palaceIndex === palaceIndex);
}

function formatCurrentTimePrefix() {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");

  return `当前时间：${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日${hours}:${minutes}\n\n`;
}
