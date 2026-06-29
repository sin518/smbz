import type { ZiweiChart, ZiweiPalace } from "@/lib/ziwei/calculate";

export type ZiweiAiCommandFocus =
  | "全项"
  | "命格"
  | "事业"
  | "财运"
  | "婚恋"
  | "健康"
  | "大限"
  | "流年";

export interface ZiweiAiCommandInput {
  chart: ZiweiChart;
  focus: ZiweiAiCommandFocus;
}

const focusDescriptions: Record<ZiweiAiCommandFocus, string> = {
  全项: "命宫、身宫、三方四正、事业、财帛、婚恋、健康、大限与流年均需覆盖。",
  命格: "重点分析命宫、身宫、迁移宫与三方四正，说明性格、能力结构和人生主轴。",
  事业: "重点分析命宫、官禄宫、财帛宫、迁移宫与福德宫，给出现实职业建议。",
  财运: "重点分析财帛宫、福德宫、田宅宫、官禄宫及大限趋势，不得作投资保证。",
  婚恋: "重点分析夫妻宫、命宫、福德宫、子女宫与三方四正，不得作婚姻绝对判断。",
  健康: "重点分析疾厄宫、父母宫、福德宫与压力来源，不得替代医疗诊断。",
  大限: "重点分析当前与后续大限，说明十年阶段主题、机会、风险与行动建议。",
  流年: "重点分析流年命宫、小限命宫及其三方四正，输出未来五年趋势。",
};

const focusInstructions: Record<ZiweiAiCommandFocus, string[]> = {
  全项: [
    "本次任务类型：全项综合分析。",
    "请完整覆盖命盘总览、命格性格、事业财帛、婚恋人际、健康作息、大限与未来五年。各部分篇幅均衡，不要只集中在单一宫位。",
  ],
  命格: [
    "本次任务类型：命格专项分析。",
    "请把主要篇幅放在命宫、身宫、迁移宫与命宫三方四正，重点说明性格底色、能力结构、人生主轴、优劣势与修正建议。",
    "事业、财帛、婚恋、健康只需作为命格延伸简述，不要展开成长篇综合报告。",
  ],
  事业: [
    "本次任务类型：事业专项分析。",
    "请把主要篇幅放在官禄宫、命宫、财帛宫、迁移宫、福德宫，以及相关三方四正和大限触发。",
    "输出必须包含职业方向、能力优势、工作模式、合作关系、阶段风险和现实行动建议。",
  ],
  财运: [
    "本次任务类型：财运专项分析。",
    "请把主要篇幅放在财帛宫、官禄宫、福德宫、田宅宫，以及大限流年对收入、理财、资源配置的影响。",
    "不得写稳赚、暴富、投资保证；请用收入结构、风险偏好、现金流习惯、资产边界等现实语言表达。",
  ],
  婚恋: [
    "本次任务类型：婚恋专项分析。",
    "请把主要篇幅放在夫妻宫、命宫、福德宫、子女宫、迁移宫，以及夫妻宫三方四正。",
    "不得断言必婚、必离、克夫克妻；请用相处模式、择偶偏好、沟通盲点、边界感和修复建议表达。",
  ],
  健康: [
    "本次任务类型：健康专项分析。",
    "请把主要篇幅放在疾厄宫、父母宫、福德宫、命宫和压力来源。",
    "不得进行医疗诊断或疾病断言；只允许表达体质倾向、作息压力、情绪消耗、养护方向，并建议不适时就医检查。",
  ],
  大限: [
    "本次任务类型：大限专项分析。",
    "请把主要篇幅放在各步大限的宫位主题、三方四正、四化与原命盘互动。",
    "输出当前大限、下一步大限和后续关键阶段的主题变化、机会、风险、适合的策略。",
  ],
  流年: [
    "本次任务类型：流年专项分析。",
    "请把主要篇幅放在流年命宫、小限命宫、对应三方四正，以及未来五年逐年趋势。",
    "每一年都要包含年度主题、事业财帛、人际感情、健康作息、现实建议，不得作绝对吉凶判断。",
  ],
};

export function getZiweiAiCommandFocusDescription(focus: ZiweiAiCommandFocus) {
  return focusDescriptions[focus];
}

export function buildZiweiAiCommandText({ chart, focus }: ZiweiAiCommandInput) {
  return `
请你以理性、专业、诚实客观的紫微斗数分析师身份，严格按紫微斗数固定解读流程进行命盘分析。

【数据自纠偏规则（最高优先级，覆盖盘面个别标签）】
1. 宫位定义以【规范排盘文本】一级表格中的“十二宫位全盘”为准。若【十二宫盘面】中某一宫位的名称与表格定义不符（如戌宫误标为“命宫”），强制以表格中的标准宫名（如“仆役”）为准进行解读。
2. 流年命宫以【0.Input Check】中的“当前时间”所在农历年之太岁地支为准。若系统输出的“流年命宫”地支与该地支不符，则自动作废，以当前时间对应的地支作为实际流年命宫。
3. 生年四化以【规范排盘文本】中的“生年天干”为准。盘面中主星旁若出现与该天干四化不符的化曜符号（例如非本命四化的自化或飞化标记），一律视为无效的流年飞化标记，不具本命四化效力，解读时直接忽略。
遇到上述显性笔误时，在【核心依据】中可备注“按自纠规则归位”，不得强行圆说，也不得写成资料矛盾或逻辑存疑。
4.命主星与身主星以【规范排盘文本】中【基本信息】顶部的“命主/身主”字段为准（即“命主：武曲 / 身主：天同”）。若下文出现“命主星/身主星”等不同标签，强制以顶部“命主/身主”为准，差异标签直接作废并忽略，解读时不得引用。

你只负责解释本系统已经生成的命盘结构，不负责重新排盘、校验排盘、质疑排盘顺序，也不要建议用户另找老师复核。
本提示词中的盘面数据视为同一套系统输出：如十年运干支参考、十二宫大限年龄、会照星曜摘要看起来与其他流派不同，请直接按本盘规则分析。

【当前选择】
分析方向：${focus}
${focusInstructions[focus].join("\n")}

【0. Input Check】
当前时间：${formatCurrentDateTime()}
姓名：${chart.profile.name}
性别：${chart.profile.gender}
出生时间：${chart.profile.solarText}
农历：${chart.profile.lunarText}
出生地点：${chart.profile.location}
阴阳性别与五行局：${chart.profile.yinYangGender} ${chart.profile.fiveElementClass}
四柱：年${chart.pillars.year} 月${chart.pillars.month} 日${chart.pillars.day} 时${chart.pillars.hour}
必要输入已由前端排盘流程提供；若你发现字段缺失，只能说明缺失对判断的影响，不要编造数据。

【规范排盘文本】
${chart.canonicalText}

【1. 命盘骨架层】
命主：${chart.profile.soul}
身主：${chart.profile.body}
五行局：${chart.profile.fiveElementClass}
命宫：${chart.profile.lifeBranch}
身宫：${chart.profile.bodyBranch}
系统输出流年命宫：${chart.profile.annualBranch}（注：若与当前时间太岁地支不符，按【数据自纠偏规则】以当前时间为准覆盖）
小限命宫：${chart.profile.smallLimitBranch}
起运：${chart.profile.luckStartText}，起运岁数：${chart.profile.luckAgeText}
请先看命宫/身宫定位，再看主星组合与四化分布；命宫无主星时参考迁移宫，但不可越过命宫直接定论。

【四化】（以下为生年四化，具本命效力）
化禄：${chart.sihua.禄}
化权：${chart.sihua.权}
化科：${chart.sihua.科}
化忌：${chart.sihua.忌}
【四化标记降噪说明】盘面中主星旁若出现与上述生年四化不符的化曜符号（如非本命四化的↑↓标记），一律视为无效的流年飞化标记，不具本命四化效力，解读时忽略。

【2. 宫位主题层（Mandatory）】
必查宫位：命宫、官禄宫、财帛宫、夫妻宫、疾厄宫；同时结合身宫、福德宫、迁移宫与三方四正。
每宫需关注宫名、主星亮度、辅星/杂曜、四化、是否身宫；每条判断至少绑定一个宫位或星曜依据。

【十二宫盘面】（注：宫位名称如与【规范排盘文本】冲突，以表格定义为准）
${chart.palaces.map(formatPalace).join("\n")}

【3. 大限层（Mandatory）】
请根据【0.Input Check】中的当前时间和用户年龄定位当前大限；先看当前大限宫位与主导星曜，再判断该十年主题是扩张、沉淀、转型还是防守，并映射到事业、关系、财务优先级。

【十年运干支参考】
说明：以下为中宫显示的十年运干支与年龄段参考；如存在起运年份则一并列出。不等同于十二宫盘面中的宫位大限年龄。分析具体大限落宫时，以【十二宫盘面】里每宫的“大限年龄”为准；不要比较不同流派排法，也不要提示存在矛盾。
${chart.profile.majorLimitItems.map(formatMajorLimitItem).join("\n")}

【4. 冲突与补偿层】
请找出可放大的优势结构、需要补偿的结构短板，并给出可执行补偿策略；避免空泛标签。

【分析重点】
${getZiweiAiCommandFocusDescription(focus)}

【5. 结论层】
1. 论人生大局以命宫、身宫、财帛宫、官禄宫、迁移宫、福德宫为主，必须结合三方四正和对宫。
2. 星曜庙、旺、得、利、平、陷只表示力量状态，仍需结合吉曜、煞曜、四化和宫位性质综合判断。
3. 大限以十二宫盘面中的“大限年龄”为宫位依据；十年运干支参考只用于辅助观察年份节奏，不可替代宫位大限。
4. 大限、小限、流年命宫（以自纠偏后的实际值）各自都要结合本宫、对宫、三方四正，不可孤立解释。
5. 男命和女命强弱宫侧重点不同，但不得使用贬低性别或宿命论表达。
6. 会照星曜摘要是软件预先归纳的参考信息，只用于辅助解释星曜会照，不要用它反推或质疑对宫、三合宫的几何关系。

【表达限制】
禁止宿命论、恐吓式表达、医疗诊断、投资保证、婚姻绝对判断。
必须解释紫微术语，输出应清晰、可理解、可执行。
建议只作为传统文化与自我观察参考，不替代法律、医疗、投资、心理咨询等专业服务。

【输出结构】
1. 结论摘要：3-5行，包含命盘主轴、当前大限主题和本次分析重点。
2. 核心依据：列出4-8条证据，必须引用命宫/身宫、主星、四化、宫位、大限或三方四正数据。
3. 分步解读：按紫微斗数固定解读流程的命盘骨架层、宫位主题层、大限层、冲突与补偿层依次展开，不得跳步。
4. 时间节奏：说明当前十年主题、未来几年重点、近中远期取舍。
5. 行动建议：给出事业、关系、财务或健康中与本次重点相关的具体执行建议。
6. 风险与边界：说明哪些信息不能仅凭命盘确定，提醒仅供传统文化研究与自我观察参考。
`;
}

function formatPalace(palace: ZiweiPalace) {
  const palaceTitle = palace.isBodyPalace
    ? `身｜${palace.palaceName}`
    : palace.palaceName;
  const mainStars = palace.mainStars.length
    ? palace.mainStars.join("、")
    : "空宫";
  const minorStars = palace.minorStars.length
    ? palace.minorStars.join("、")
    : "无";
  const transformations = palace.transformations.length
    ? palace.transformations.join("、")
    : "无";

  return [
    `${palace.branch}宫 ${palace.stem}${palace.branch} ${palaceTitle}`,
    `主星：${mainStars}`,
    `辅杂星：${minorStars}`,
    `四化：${transformations}`,
    `长生：${palace.changSheng}`,
    `大限年龄：${palace.ageRange}`,
    `流年年龄：${formatAgeList(palace.annualAges)}`,
    `小限年龄：${formatAgeList(palace.smallLimitAges)}`,
    `会照星曜摘要：${palace.sanfangImpact}`,
  ].join("；");
}

function formatMajorLimitItem(
  item: ZiweiChart["profile"]["majorLimitItems"][number],
  index: number,
) {
  const startYearText = item.startYear ? `，${item.startYear}年起` : "";
  return `${index + 1}. ${item.stemBranch}，${item.ageText}${startYearText}`;
}

function formatCurrentDateTime() {
  return new Intl.DateTimeFormat("zh-CN", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date());
}

function formatAgeList(ages: number[]) {
  return ages.join("、");
}
