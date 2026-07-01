import { toQimenText, type QimenOutput } from "taibu-core/qimen";

type QimenChart = QimenOutput;

export type QimenAiCommandFocus =
  | "全项"
  | "事业"
  | "财运"
  | "婚恋"
  | "健康"
  | "出行"
  | "官讼"
  | "学业"
  | "投资";

type QimenAiCommandInput = {
  chart: QimenChart;
  focus?: QimenAiCommandFocus;
};

const focusDescriptions: Record<QimenAiCommandFocus, string> = {
  全项: "事业、财富、感情、健康、出行、官讼等均需覆盖。",
  事业: "重点分析开门、值符、值使、日干宫位与时干宫位，给出职业方向、能力优势、工作节奏与阶段风险。",
  财运: "重点分析生门、财星、日干承财能力、时干宫位状态，给出收入结构、投资风险与现金流建议。",
  婚恋: "重点分析六合、日干宫位、对方宫位（时干或对应用神）、天喜红鸾等桃花星，给出感情模式与沟通建议。",
  健康: "重点分析疾厄宫（天芮、死门、白虎等）、日干状态、空亡、入墓，给出体质倾向、作息养护，不得替代医疗诊断。",
  出行: "重点分析驿马、值使门、目标方位宫位、日干时干关系，给出出行吉凶、方位选择与时机建议。",
  官讼: "重点分析开门、杜门、景门、惊门、官星（庚）、白虎、朱雀，给出诉讼胜算、谈判策略与风险预警。",
  学业: "重点分析开门、天辅、天心、文昌、日干状态，给出学习方式、考试节奏、专业选择建议。",
  投资: "重点分析生门、财星、日干承财能力、空亡、门迫、凶格，给出投资时机、风险评估与资金规模建议。",
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

function buildQimenSystemPrompt(chart: QimenChart, focus: QimenAiCommandFocus) {
  const topic = buildTopic(chart, focus);
  const question = chart.question?.trim() || topic;
  const dayStem = getStemFromPillar(chart.siZhu.day);
  const hourStem = getStemFromPillar(chart.siZhu.hour);
  const analysisTitle = getAnalysisTitle(focus);

  return `
你是一位精通奇门遁甲的命理分析师，请根据我提供的奇门盘信息，输出一份「奇门遁甲${analysisTitle}详解」。

## 安全红线（必须遵守）
1. 信息不足时明确告知「条件不足，无法准确判断」，不编造数据。
2. 命理术数仅供参考；在准确判断吉凶的基础上，以客观态度输出，**不得因“正能量”“正向引导”而回避或弱化凶的判断**。若结果为凶，直言其凶。允许使用“大凶”“凶”“无解”“难成”“破财难免”“不宜行动”等古典或直白术语。
3. 不做恐吓性、绝对化的吉凶判定（如“必死”“必破产”等）。
4. 禁止恐吓、宿命论、医疗/投资/法律保证、玄学化解和付费引导。
5. 回答须基于提供的盘面信息与奇门理论依据，不凭空臆断。

## 输出分析强制顺序（先论凶，后论吉）
- **第一步：排查全局凶兆**（反吟、伏吟、五不遇时、时干入墓、值符值使空亡门迫等）。若有，先断其凶。
- **第二步：排查用神宫凶兆**（用神宫空亡、门迫、逢凶格、天蓬/天柱/天芮等凶星临宫）。若有，直接判凶。
- **第三步：排查自身凶兆**（日干空亡、入墓、受克、逢死门/惊门/白虎等）。若有，直言”自身有损，所求受阻”。
- **第四步：排查生克凶兆**（用神克日干、日干克用神、时干克日干）。若有，直言”事与愿违”或”强求无益”。
- **仅当以上均无明显凶兆时，方可进入吉兆判断**。

请严格按照以下结构分析，语言风格要**专业、直接、细致**，有直断结论，也要有用神、宫位、格局、星门神、空亡、应期和行动建议。

主题：
奇门遁甲${analysisTitle}详解：${topic}

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
奇门遁甲${analysisTitle}详解：${topic}

二、直断结论
先用一段话直接判断整体趋势，**必须优先指出凶险，后谈机会（如有）**。
必须包含：
- 总体吉凶判断（若为凶，用”大凶””凶””平中带凶”等，不得用”注意””谨慎”模糊替代）
- 机会大小（若无机会，直接说”机会渺茫”）
- 风险来源（具体指出哪个宫位、哪个格局导致）
- 是否适合进行此事（若不适合，直接说”强烈不建议”）
- 用一句总结格局，例如：”财旺身弱，得而复失””凶多吉少，守成为上””大凶无解，切忌妄动””先难后易，晚运可期”

三、重复用户问题
格式：
${question}

四、用神定位与核心格局分析

1. 用神选取
请说明：
${getUserGodSelection(focus)}
- 如涉及其他维度，可补充对应参考用神

2. 核心宫位分析
围绕主要用神所在宫分析：
- 宫位五行
- 门、星、神、天盘干、地盘干
- 是否有吉门、吉星、凶神、凶格
- 天地盘干形成的格局和古法含义
- **若逢空亡、门迫、凶格（如庚加癸、癸加庚、辛加乙、白虎猖狂、朱雀投江等），直接判为”所求受阻”或”事难成”，并说明具体阻碍形式**
- 对所求事项的具体影响，例如实现方式、风险、阻碍、稳定性

3. 自身状态分析
围绕日干所在宫分析：
- 自身能力、心态、行动力
- **是否空亡、入墓、受克、逢凶门凶星。若日干空亡，直言”自身迷茫，无力行事”；若逢死门、白虎，直言”身心俱疲，强求有灾”**
- 是否有值符、九天、六合等助力
- 自身是否能承接所求：**若日干休囚受克，直接说”身弱不胜事，强求反招损”**
- 对事项成败的影响

五、事体与时空互动

1. 事体宫位
分析时干所在宫，说明这件所求之事本身是否顺利。
重点判断：
- 是否与用神宫同宫
- 是否受克、空亡、入墓
- 是否形成凶格或吉格
- 事情是否真实、可落地、可持续
- **若时干空亡或逢凶格，直言”此事虚而不实，求之无益”**

2. 生克关系决定吉凶
分析：
- 用神宫与日干宫的生克
- 时干宫与日干宫的生克
- 门、星、神之间的辅助判断
- 是”用神生我””我去求用神””用神克身””身弱不胜用神”还是”比和相助”
- **若用神克日干宫，直接说”所求克身，求之反招灾祸”**
- **若日干宫克用神宫，直接说”强求无功，劳而无获”**
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

请给出具体建议，分为以下几类。**若盘面为凶，则大部分建议应为”不宜””避免””放弃”，不得给出”可以谨慎尝试”等虚假希望。**

${getActionGuidance(focus)}

八、整体风格要求
- **先凶后吉，不得颠倒顺序。**
- 不要只说吉凶，要解释为什么。
- 语言要像专业命理师直断，不要太含糊。
- 可以引用古法格局，但引用后必须翻译成现代含义。
- 结论要清楚，建议要可执行。
- **如果盘面凶，要直接说明风险，使用”大凶””无解””不利””不宜””禁止”等词汇，不要用”注意””谨慎””可能”来弱化。**
- 如果凶中有吉，要说明吉在哪里、如何用，但不得掩盖凶的主导地位。
- 不要编造盘面中没有的信息。
`;
}

export function buildQimenAiCommandText({ chart, focus = "财运" }: QimenAiCommandInput) {
  const chartInfo = toQimenText(chart);

  return `【系统提示词】
${formatCurrentTimePrefix()}${buildQimenSystemPrompt(chart, focus)}

【用户提示词】
${chartInfo}

请根据以上奇门遁甲排盘信息，为求测者详细解读此局。`;
}

function buildTopic(chart: QimenChart, focus: QimenAiCommandFocus) {
  const question = chart.question?.trim();
  if (!question) {
    return getFocusDefaultTopic(focus);
  }

  // 如果用户问题已经包含了焦点关键词，直接使用
  const focusKeywords = getFocusKeywords(focus);
  if (focusKeywords.some(keyword => question.includes(keyword))) {
    return question;
  }

  // 否则加上焦点后缀
  return `${question}${getFocusDefaultTopic(focus)}`;
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

export function getQimenAiCommandFocusDescription(focus: QimenAiCommandFocus) {
  return focusDescriptions[focus];
}

function getAnalysisTitle(focus: QimenAiCommandFocus): string {
  const titles: Record<QimenAiCommandFocus, string> = {
    全项: "综合",
    事业: "事业",
    财运: "财运",
    婚恋: "感情",
    健康: "健康",
    出行: "出行",
    官讼: "官讼",
    学业: "学业",
    投资: "投资",
  };
  return titles[focus];
}

function getFocusDefaultTopic(focus: QimenAiCommandFocus): string {
  const topics: Record<QimenAiCommandFocus, string> = {
    全项: "综合分析",
    事业: "事业分析",
    财运: "财运分析",
    婚恋: "感情分析",
    健康: "健康分析",
    出行: "出行分析",
    官讼: "官讼分析",
    学业: "学业分析",
    投资: "投资分析",
  };
  return topics[focus];
}

function getFocusKeywords(focus: QimenAiCommandFocus): string[] {
  const keywords: Record<QimenAiCommandFocus, string[]> = {
    全项: ["综合", "全面"],
    事业: ["事业", "工作", "职业", "跳槽", "升职"],
    财运: ["财", "钱", "收入", "赚钱"],
    婚恋: ["感情", "婚姻", "恋爱", "桃花", "对象"],
    健康: ["健康", "身体", "疾病", "养生"],
    出行: ["出行", "旅行", "搬家", "迁移"],
    官讼: ["官司", "诉讼", "纠纷", "仲裁", "法律"],
    学业: ["学业", "考试", "升学", "学习"],
    投资: ["投资", "理财", "股票", "创业"],
  };
  return keywords[focus];
}

function getUserGodSelection(focus: QimenAiCommandFocus): string {
  const selections: Record<QimenAiCommandFocus, string> = {
    全项: `- 综合用神：根据问题性质选择（事业看开门，财运看生门，感情看六合，健康看疾厄相关，等等）
- 自身用神：日干落在哪一宫
- 事体用神：时干落在哪一宫`,
    事业: `- 事业首要用神：优先看开门，落在哪一宫
- 自身用神：日干落在哪一宫
- 事体用神：时干落在哪一宫
- 辅助用神：值符（权威/老板）、景门（文书/名声）`,
    财运: `- 财运首要用神：优先看生门，落在哪一宫
- 自身用神：日干落在哪一宫
- 事体用神：时干落在哪一宫
- 如涉及投资、合作、工作收入、偏财，可补充对应参考用神`,
    婚恋: `- 感情首要用神：优先看六合，落在哪一宫
- 自身用神：日干落在哪一宫
- 对方用神：时干落在哪一宫（或对应宫位）
- 辅助用神：天喜、红鸾、桃花星`,
    健康: `- 健康首要用神：优先看天芮星、死门、疾厄相关宫位
- 自身用神：日干落在哪一宫
- 辅助用神：白虎（外伤/急症）、天柱（慢性病）`,
    出行: `- 出行首要用神：优先看驿马、值使门
- 自身用神：日干落在哪一宫
- 目标方位：时干落在哪一宫（或目标方位宫）
- 辅助用神：天马、腾蛇（动荡）`,
    官讼: `- 官讼首要用神：优先看开门（公开）、杜门（阻塞）、景门（文书）
- 自身用神：日干落在哪一宫
- 对方用神：时干落在哪一宫
- 辅助用神：庚（官星）、白虎（凶险）、朱雀（口舌）`,
    学业: `- 学业首要用神：优先看开门，落在哪一宫
- 自身用神：日干落在哪一宫
- 考试用神：时干落在哪一宫
- 辅助用神：天辅（学习）、天心（思考）、文昌`,
    投资: `- 投资首要用神：优先看生门，落在哪一宫
- 自身用神：日干落在哪一宫
- 项目用神：时干落在哪一宫
- 辅助用神：财星、空亡（风险）、门迫（阻碍）`,
  };
  return selections[focus];
}

function getActionGuidance(focus: QimenAiCommandFocus): string {
  const guidances: Record<QimenAiCommandFocus, string> = {
    全项: `1. 事业方面
- 若凶：说"不宜跳槽、不宜创业、稳守现有岗位"
- 若吉：说"可争取升职、拓展、新机会"

2. 财务方面
- 若凶：直接说"暂停投资，削减开支，预留现金"
- 若吉：给出守财、投资建议

3. 感情方面
- 若凶：说"不宜急于求成，先调整自身状态"
- 若吉：给出主动策略、沟通建议

4. 健康方面
- 如果日干宫有死门、天芮、白虎、空亡等，提醒健康风险

5. 方位建议
- 结合有利宫位给出方位建议。**若全局为凶，可写"无有利方位，宜静不宜动"**`,
    事业: `1. 职业方向
- 若凶：说"不宜跳槽、不宜转行、稳守现有岗位，避免冲突"
- 若吉：说"可争取升职、跳槽、拓展新业务"

2. 能力提升
- 根据开门、值符、日干状态给出学习方向

3. 合作关系
- **若凶：直接说"不宜合伙、避免站队、低调行事"**
- 若吉：可给出合作方向、贵人方位

4. 时机选择
- 结合应期给出行动时间建议

5. 方位建议
- 结合有利宫位或日干宫给出求职方位、发展方位。**若全局为凶，可写"无有利方位，宜静不宜动"**`,
    财运: `1. 财务策略
- 若凶：直接说"只进不出，暂停一切投资，削减开支，预留现金"
- 若吉：给出守财、投资、杠杆等建议

2. 工作与事业
- 若凶：说"不宜跳槽、不宜创业、稳守现有岗位，避免冲突"
- 若吉：说"可争取升职、跳槽、拓展"

3. 合作与投资
- **若凶：直接说"严禁合伙、禁止借贷、禁止担保、禁止创业扩张"**
- 若吉：可给出合作方向

4. 健康与情绪
- 如果日干宫有死门、天芮、白虎、空亡等，要提醒健康、压力、过劳、冲动决策，**并直接说"当前状态不适合做重大财务决策"**

5. 方位建议
- 结合有利宫位或日干宫，给出可参考的求助方位、行动方位或避险方位。**若全局为凶，可写"无有利方位，宜静不宜动"**`,
    婚恋: `1. 感情策略
- 若凶：说"不宜急于表白、不宜闪婚、先调整自身状态"
- 若吉：给出主动策略、表白时机

2. 沟通建议
- 根据六合、日干、时干关系给出沟通方式

3. 对方状态
- 分析时干宫判断对方意愿、真实性

4. 时机选择
- 结合应期给出行动时间建议

5. 方位建议
- 结合有利宫位给出约会方位、桃花方位。**若全局为凶，可写"无有利方位，宜静待时机"**`,
    健康: `1. 体质倾向
- 根据天芮、死门、日干状态说明易感疾病类型

2. 作息建议
- 若有凶星凶门，强调休息、避免过劳

3. 情绪管理
- 如有白虎、腾蛇、惊门，提醒焦虑、紧张、失眠风险

4. 就医建议
- **若日干宫凶或疾厄宫凶，直接说"建议及时就医检查，不可拖延"**

5. 方位建议
- 结合有利宫位给出养生方位、就医方位。**若全局为凶，可写"减少外出，静养为主"**`,
    出行: `1. 出行吉凶
- 若凶：直接说"不宜远行、推迟为宜、若非必要避免出行"
- 若吉：说"可以出行，注意安全"

2. 方位选择
- 根据驿马、值使门、目标方位宫给出最佳方位、次佳方位、凶方位

3. 时机选择
- 结合应期给出出行时间建议

4. 交通方式
- 若有凶星凶门，提醒避免高风险交通方式

5. 注意事项
- 若有白虎、腾蛇等，提醒意外风险、文件丢失等`,
    官讼: `1. 诉讼胜算
- 若凶：直接说"胜算渺茫，建议和解或撤诉"
- 若吉：说"有胜算，可坚持"

2. 谈判策略
- 根据日干、时干、开门、杜门关系给出谈判方式

3. 文书准备
- 若景门有利，强调文书证据；若凶，提醒文书漏洞

4. 时机选择
- 结合应期给出起诉时间、开庭时间建议

5. 风险预警
- 若有白虎、朱雀等，提醒刑罚风险、名誉损失`,
    学业: `1. 学习方法
- 根据开门、天辅、日干状态给出学习方式

2. 考试运势
- 若凶：说"考试运势不佳，需加倍努力或延期"
- 若吉：说"考试运势尚可，正常发挥"

3. 专业选择
- 根据用神宫位五行、格局给出专业方向

4. 时机选择
- 结合应期给出报名时间、考试时间建议

5. 方位建议
- 结合有利宫位给出学习方位、考场方位。**若全局为凶，可写"调整状态为主，方位次之"**`,
    投资: `1. 投资时机
- 若凶：直接说"严禁投资、暂停一切扩张、撤回本金"
- 若吉：给出投资时机、资金规模建议

2. 项目评估
- 根据时干宫判断项目真实性、可行性

3. 风险控制
- **若有空亡、门迫、凶格，直接说"风险极大，禁止杠杆、禁止ALL IN"**

4. 合作方评估
- 根据时干、用神关系判断合作方可信度

5. 退出策略
- 若凶，给出止损点、退出时机`,
  };
  return guidances[focus];
}
