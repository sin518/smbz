import type { QimenOutput } from "taibu-core/qimen";

type QimenChart = QimenOutput;

type QimenAiCommandInput = {
  chart: QimenChart;
  profile?: {
    name?: string;
    gender?: string;
    divinationType?: string;
    location?: string;
  };
};

const STAR_WEIGHTS: Record<string, { nature: string; weight: number }> = {
  天禽: { nature: "吉", weight: 100 },
  天任: { nature: "吉", weight: 85 },
  天辅: { nature: "吉", weight: 90 },
  天心: { nature: "吉", weight: 90 },
  天冲: { nature: "吉", weight: 80 },
  天英: { nature: "平", weight: 60 },
  天蓬: { nature: "凶", weight: 30 },
  天柱: { nature: "凶", weight: 40 },
  天芮: { nature: "凶", weight: 20 }
};

const GATE_WEIGHTS: Record<string, { nature: string; weight: number }> = {
  开门: { nature: "吉", weight: 95 },
  生门: { nature: "吉", weight: 100 },
  休门: { nature: "吉", weight: 90 },
  景门: { nature: "平", weight: 65 },
  杜门: { nature: "平", weight: 50 },
  惊门: { nature: "凶", weight: 40 },
  伤门: { nature: "凶", weight: 30 },
  死门: { nature: "凶", weight: 10 }
};

const DIVINATION_TYPE_LABELS: Record<string, string> = {
  wealth: "财运走势",
  single: "单身姻缘",
  relationship: "伴侣感情",
  promotion: "工作升职",
  job: "工作求职",
  cooperation: "合作谈判",
  lawsuit: "官司诉讼"
};

export function buildQimenAiCommandText({ chart, profile }: QimenAiCommandInput) {
  const suggestedUseGod = getSuggestedUseGod(chart, profile?.divinationType);

  return `角色定位
你是以奇门遁甲拆补法/置润法为参考框架的文本解盘助手。你的任务不是重新排盘，而是只根据下方已生成的奇门盘数据做结构化解释。请保持理性表达，所有内容仅供国学传统文化研究与休闲娱乐参考，不构成投资、医疗、法律或人生决策依据。

执行约束
1. 只允许使用本提示词给出的盘面数据、九星/八门权重和解读规则，不要引入提示词外的流派、口诀或补充排盘。
2. 不得输出改命、转运、化解、做法、购买物品、付费服务等封建迷信或营销导向内容。
3. 每个判断都要写出规则依据，例如“因用神宫八门为生门，权重100，故按门象偏吉处理”。
4. 信息不足时直接说明缺少哪些信息，不要自行编造时间、干支、用神或格局。
5. 结论必须是参考性、条件式表达，禁止恐吓式、绝对化断语。
6. 用神落宫一旦在【三、用神确定】中确定，后续【四、用神宫分析】【五、格局与关系判断】必须始终使用同一宫位、同一组天地盘/星门神，不得在后文另写“修正”“改判”“重新定位”等自我否定表述。若发现前后不一致，应直接重写为一致版本，不要保留矛盾文字。

标准化执行流程（必须按顺序执行）
步骤1：核对本次起局基础信息，说明阳遁/阴遁、局数、值符、值使。
步骤2：根据求测事项确定核心用神，并说明取用理由；若题目过泛，应先按最贴近的问题类型取用并标注不确定性。
步骤3：定位用神落宫，读取该宫的天盘干、地盘干、九星、八门、八神与宫位方向。
步骤4：依据九星与八门权重判断用神宫的基础倾向，优先看八门，其次看九星，再结合八神与天地盘干。
步骤5：识别盘面关键状态：值符值使落宫、空亡提示、门宫关系、伏吟/反吟迹象、明显吉凶组合。没有足够数据时标注“本盘资料未提供，不强断”。
步骤6：分析日干与用神宫的关系；若当前资料缺少五行映射或生克所需字段，必须说明无法完整判断，不得编造。
步骤7：综合判断事情的顺阻、变化点、可参考时间与方位，只能基于盘面方向、宫位、门星权重做保守推理。
步骤8：给出正向、现实、可执行的建议，并再次提示结果仅供参考。

奇门规则库（本次推理唯一依据）
1. 九星权重：数值越高越偏顺，越低越偏阻；吉凶只作倾向参考。
${formatWeightTable(STAR_WEIGHTS, "星名")}

2. 八门权重：八门为用神宫判断的优先参考，生门、开门、休门偏顺，死门、伤门、惊门偏阻，景门、杜门偏中性。
${formatWeightTable(GATE_WEIGHTS, "门名")}

3. 综合原则：吉格多则事顺，凶格多则事阻；用神旺相为顺，休囚死为阻；门克宫为迫，宫克门为制；空亡之宫不作实象；马星主变动；伏吟主缓慢不动，反吟主反复。
4. 本页面当前只提供九宫盘、四柱、值符值使、旬首、空亡标记与排盘说明。若要判断旺相休囚死、门宫生克、马星、伏吟反吟而资料不足，必须明确写“资料不足，不能强断”。

当前奇门排盘资料
${formatChartText(chart, profile)}
${suggestedUseGod ? `\n系统用神候选\n${suggestedUseGod}\n请优先采用以上候选；如果你认为需要改用其他用神，必须在【三、用神确定】先说明改用理由，并且后续全文只按最终确定的同一宫位分析。` : ""}

固定输出格式（请严格按以下顺序输出）
【一、起局基础信息】
起局时间：
求测事项：
盘式：
四柱：
值符值使：

【二、九宫格文本盘】
请先完整复述九宫盘，每宫包含：宫名/方向、天盘干、地盘干、九星、八门、八神、是否值符/值使。

【三、用神确定】
核心用神：
取用依据：
用神落宫：
一致性要求：此处写定的用神落宫必须作为后文唯一分析对象。

【四、用神宫分析】
用神宫：（必须与【三、用神确定】的“用神落宫”完全一致）
天地盘：
九星权重：
八门权重：
八神：
空亡/特殊状态：
规则依据：

【五、格局与关系判断】
整体格局：
日干与用神关系：
成败顺阻：
时间与方位参考：

【六、最终参考结论】
结论定性：
关键提示：
现实建议：
风险边界：

【重要声明】
以上内容仅为国学奇门遁甲传统文化研究与休闲娱乐参考，不构成投资、医疗、法律或人生决策依据。`;
}

function formatWeightTable(weights: Record<string, { nature: string; weight: number }>, firstColumn: string) {
  return `${firstColumn}\t吉凶\t权重\n${Object.entries(weights)
    .map(([name, value]) => `${name}\t${value.nature}\t${value.weight}`)
    .join("\n")}`;
}

function formatChartText(chart: QimenChart, profile: QimenAiCommandInput["profile"]) {
  const dunText = chart.dunType === "yang" ? "阳遁" : "阴遁";
  const pillars = `年${chart.siZhu.year} 月${chart.siZhu.month} 日${chart.siZhu.day} 时${chart.siZhu.hour}`;
  const profileLines = [
    `姓名：${profile?.name?.trim() || "未填写"}`,
    `性别：${profile?.gender === "female" ? "女" : profile?.gender === "male" ? "男" : "未填写"}`,
    `求测类型：${formatDivinationType(profile?.divinationType)}`,
    `求测问题：${chart.question || "未填写"}`
  ];

  return [
    profileLines.join("\n"),
    `地点：${profile?.location ?? "未填写"}`,
    `起局时间：${chart.dateInfo.solarDate}（${chart.dateInfo.lunarDate}）`,
    `四柱：${pillars}`,
    `节气：${chart.dateInfo.solarTerm}${chart.yuan}`,
    `盘式：${chart.panType}，${dunText}${chart.juNumber}局`,
    `旬首：${chart.xunShou}`,
    `值符：${chart.zhiFu.star}落${chart.zhiFu.palace}宫`,
    `值使：${chart.zhiShi.gate}落${chart.zhiShi.palace}宫`,
    `日空：${chart.kongWang.dayKong.branches.join("、") || "无"}；时空：${chart.kongWang.hourKong.branches.join("、") || "无"}`,
    `驿马：${chart.yiMa.branch || "无"}${chart.yiMa.palace ? `，落${chart.yiMa.palace}宫` : ""}`,
    "",
    "九宫格文本盘（按巽四、离九、坤二 / 震三、中五、兑七 / 艮八、坎一、乾六排列）",
    ...getDisplayPalaces(chart).map((palace) => formatPalace(chart, palace)),
    "",
    "全局格局",
    ...(chart.globalFormations.length ? chart.globalFormations.map((item) => `- ${item}`) : ["- 未见明确格局"])
  ].join("\n");
}

function formatPalace(chart: QimenChart, palace: QimenChart["palaces"][number]) {
  const star = STAR_WEIGHTS[normalizeStarName(palace.star)];
  const gate = palace.gate ? GATE_WEIGHTS[palace.gate] : null;
  return [
    `${palace.palaceName}${palace.palaceIndex}（${palace.direction}，${palace.palaceIndex}宫）`,
    `  天盘干：${palace.heavenStem}；地盘干：${palace.earthStem}`,
    `  九星：${palace.star}（${star?.nature ?? "未知"}，权重${star?.weight ?? "未知"}）`,
    `  八门：${palace.gate ? `${palace.gate}（${gate?.nature ?? "未知"}，权重${gate?.weight ?? "未知"}）` : "无"}`,
    `  八神：${palace.deity || "无"}${palace.palaceIndex === chart.zhiFu.palace ? "；此宫为值符落宫" : ""}${palace.palaceIndex === chart.zhiShi.palace ? "；此宫为值使落宫" : ""}`,
    `  状态：${formatPalaceState(palace)}`
  ].join("\n");
}

function getSuggestedUseGod(chart: QimenChart, divinationType: string | undefined) {
  if (divinationType !== "wealth") {
    return "";
  }

  const palace = chart.palaces.find((item) => item.heavenStem === "戊");
  if (!palace) {
    return "财运类问题：建议核心用神为妻财（戊）。当前九宫盘未找到天盘干戊，需在输出中说明资料不足，不能自行指定落宫。";
  }

  const star = STAR_WEIGHTS[normalizeStarName(palace.star)];
  const gate = palace.gate ? GATE_WEIGHTS[palace.gate] : null;

  return [
    "财运类问题：建议核心用神为妻财（戊）。",
    `用神落宫：${palace.palaceName}${palace.palaceIndex}（${palace.direction}，${palace.palaceIndex}宫），依据：该宫天盘干为戊。`,
    `后续用神宫分析必须使用${palace.palaceName}${palace.palaceIndex}，不得改分析其他宫位，也不得出现“修正：核心用神戊落于${palace.palaceName}${palace.palaceIndex}”这类自我修正句。`,
    `该宫盘面：天盘干${palace.heavenStem}，地盘干${palace.earthStem}，九星${palace.star}（${star?.nature ?? "未知"}，权重${star?.weight ?? "未知"}），八门${palace.gate ? `${palace.gate}（${gate?.nature ?? "未知"}，权重${gate?.weight ?? "未知"}）` : "无"}，八神${palace.deity || "无"}。`
  ].join("\n");
}

function formatDivinationType(value: string | undefined) {
  return value ? DIVINATION_TYPE_LABELS[value] ?? "未选择" : "未选择";
}

const PALACE_DISPLAY_ORDER = [4, 9, 2, 3, 5, 7, 8, 1, 6];

function getDisplayPalaces(chart: QimenChart) {
  return PALACE_DISPLAY_ORDER.map((palaceIndex) => chart.palaces.find((palace) => palace.palaceIndex === palaceIndex)).filter((palace): palace is QimenChart["palaces"][number] => Boolean(palace));
}

function normalizeStarName(value: string) {
  return value.endsWith("星") ? value.slice(0, -1) : value;
}

function formatPalaceState(palace: QimenChart["palaces"][number]) {
  const states = [
    palace.isKongWang ? "空亡" : "",
    palace.isYiMa ? "驿马" : "",
    palace.isRuMu ? "入墓" : "",
    palace.formations.length ? palace.formations.join("、") : ""
  ].filter(Boolean);

  return states.length ? states.join("；") : "无特殊状态";
}
