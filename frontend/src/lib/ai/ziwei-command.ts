import type { ZiweiChart, ZiweiPalace } from "@/lib/ziwei/calculate";

export type ZiweiAiCommandFocus = "全项" | "命格" | "事业" | "财运" | "婚恋" | "健康" | "大限" | "流年";

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
  流年: "重点分析流年命宫、小限命宫及其三方四正，输出未来五年趋势。"
};

const focusInstructions: Record<ZiweiAiCommandFocus, string[]> = {
  全项: [
    "本次任务类型：全项综合分析。",
    "请完整覆盖命盘总览、命格性格、事业财帛、婚恋人际、健康作息、大限与未来五年。各部分篇幅均衡，不要只集中在单一宫位。"
  ],
  命格: [
    "本次任务类型：命格专项分析。",
    "请把主要篇幅放在命宫、身宫、迁移宫与命宫三方四正，重点说明性格底色、能力结构、人生主轴、优劣势与修正建议。",
    "事业、财帛、婚恋、健康只需作为命格延伸简述，不要展开成长篇综合报告。"
  ],
  事业: [
    "本次任务类型：事业专项分析。",
    "请把主要篇幅放在官禄宫、命宫、财帛宫、迁移宫、福德宫，以及相关三方四正和大限触发。",
    "输出必须包含职业方向、能力优势、工作模式、合作关系、阶段风险和现实行动建议。"
  ],
  财运: [
    "本次任务类型：财运专项分析。",
    "请把主要篇幅放在财帛宫、官禄宫、福德宫、田宅宫，以及大限流年对收入、理财、资源配置的影响。",
    "不得写稳赚、暴富、投资保证；请用收入结构、风险偏好、现金流习惯、资产边界等现实语言表达。"
  ],
  婚恋: [
    "本次任务类型：婚恋专项分析。",
    "请把主要篇幅放在夫妻宫、命宫、福德宫、子女宫、迁移宫，以及夫妻宫三方四正。",
    "不得断言必婚、必离、克夫克妻；请用相处模式、择偶偏好、沟通盲点、边界感和修复建议表达。"
  ],
  健康: [
    "本次任务类型：健康专项分析。",
    "请把主要篇幅放在疾厄宫、父母宫、福德宫、命宫和压力来源。",
    "不得进行医疗诊断或疾病断言；只允许表达体质倾向、作息压力、情绪消耗、养护方向，并建议不适时就医检查。"
  ],
  大限: [
    "本次任务类型：大限专项分析。",
    "请把主要篇幅放在各步大限的宫位主题、三方四正、四化与原命盘互动。",
    "输出当前大限、下一步大限和后续关键阶段的主题变化、机会、风险、适合的策略。"
  ],
  流年: [
    "本次任务类型：流年专项分析。",
    "请把主要篇幅放在流年命宫、小限命宫、对应三方四正，以及未来五年逐年趋势。",
    "每一年都要包含年度主题、事业财帛、人际感情、健康作息、现实建议，不得作绝对吉凶判断。"
  ]
};

export function getZiweiAiCommandFocusDescription(focus: ZiweiAiCommandFocus) {
  return focusDescriptions[focus];
}

export function buildZiweiAiCommandText({ chart, focus }: ZiweiAiCommandInput) {
  return [
    "请你以理性、专业、诚实客观的紫微斗数分析师身份，基于以下资料进行命盘分析。",
    "你只负责解释当前软件已经生成的命盘结构，不负责重新排盘、校验排盘、质疑排盘顺序，也不要建议用户另找老师复核。",
    "本提示词中的盘面数据视为同一套系统输出：如十年运干支参考、十二宫大限年龄、会照星曜摘要看起来与其他流派不同，请直接按本盘规则分析，不要写成资料矛盾或逻辑存疑。",
    "",
    "【当前选择】",
    `分析方向：${focus}`,
    ...focusInstructions[focus],
    "",
    "【用户基本信息】",
    `姓名：${chart.profile.name}`,
    `性别：${chart.profile.gender}`,
    `出生时间：${chart.profile.solarText}`,
    `农历：${chart.profile.lunarText}`,
    `出生地点：${chart.profile.location}`,
    `阴阳性别与五行局：${chart.profile.yinYangGender} ${chart.profile.fiveElementClass}`,
    `四柱：年${chart.pillars.year} 月${chart.pillars.month} 日${chart.pillars.day} 时${chart.pillars.hour}`,
    "",
    "【核心宫位】",
    `命宫：${chart.profile.lifeBranch}`,
    `身宫：${chart.profile.bodyBranch}`,
    `流年命宫：${chart.profile.annualBranch}`,
    `小限命宫：${chart.profile.smallLimitBranch}`,
    `起运：${chart.profile.luckStartText}，起运岁数：${chart.profile.luckAgeText}`,
    "",
    "【四化】",
    `化禄：${chart.sihua.禄}`,
    `化权：${chart.sihua.权}`,
    `化科：${chart.sihua.科}`,
    `化忌：${chart.sihua.忌}`,
    "",
    "【十年运干支参考】",
    "说明：以下为中宫显示的十年运干支与起运年份参考，不等同于十二宫盘面中的宫位大限年龄。分析具体大限落宫时，以【十二宫盘面】里每宫的“大限年龄”为准；不要比较不同流派排法，也不要提示存在矛盾。",
    chart.profile.majorLimitItems.map((item, index) => `${index + 1}. ${item.stemBranch}，${item.ageText}起，${item.startYear}年`).join("\n"),
    "",
    "【十二宫盘面】",
    chart.palaces.map(formatPalace).join("\n"),
    "",
    "【分析重点】",
    getZiweiAiCommandFocusDescription(focus),
    "",
    "【分析原则】",
    "1. 先看命宫，命宫无主星时参考迁移宫；再看身宫，身宫为辅助，不可越过命宫直接定论。",
    "2. 论人生大局以命宫、身宫、财帛宫、官禄宫、迁移宫、福德宫为主，必须结合三方四正和对宫。",
    "3. 论十二宫时，先看本宫，再看对宫、三合宫、邻宫；不得只凭单颗星曜下结论。",
    "4. 星曜庙、旺、得、利、平、陷只表示力量状态，仍需结合吉曜、煞曜、四化和宫位性质综合判断。",
    "5. 大限以十二宫盘面中的“大限年龄”为宫位依据；十年运干支参考只用于辅助观察年份节奏，不可替代宫位大限。",
    "6. 大限、小限、流年命宫各自都要结合本宫、对宫、三方四正，不可孤立解释。",
    "7. 男命和女命强弱宫侧重点不同，但不得使用贬低性别或宿命论表达。",
    "8. 会照星曜摘要是软件预先归纳的参考信息，只用于辅助解释星曜会照，不要用它反推或质疑对宫、三合宫的几何关系。",
    "",
    "【表达限制】",
    "禁止宿命论、恐吓式表达、医疗诊断、投资保证、婚姻绝对判断。",
    "必须解释紫微术语，输出应清晰、可理解、可执行。",
    "建议只作为传统文化与自我观察参考，不替代法律、医疗、投资、心理咨询等专业服务。",
    "",
    "【输出结构】",
    ...getOutputSections(focus)
  ].join("\n");
}

function getOutputSections(focus: ZiweiAiCommandFocus) {
  const sections: Record<ZiweiAiCommandFocus, string[]> = {
    全项: [
      "1. 命盘总览：核心结构、命宫/身宫、三方四正",
      "2. 性格与能力：推理过程、分析结论、现实建议",
      "3. 事业与发展：推理过程、分析结论、现实建议",
      "4. 财帛与资源：推理过程、分析结论、现实建议",
      "5. 婚恋与人际：推理过程、分析结论、现实建议",
      "6. 健康与作息：推理过程、分析结论、现实建议",
      "7. 大限与未来五年：阶段主题、风险提醒、行动建议",
      "8. 术语解释与注意事项"
    ],
    命格: [
      "1. 命格总论：命宫、身宫、迁移宫与三方四正",
      "2. 性格底色：推理过程、优势、盲点",
      "3. 能力结构：适合发挥的能力、学习方式、处事风格",
      "4. 人生主轴：长期课题、重要转折、可借力宫位",
      "5. 修正建议：现实行动、关系边界、压力管理",
      "6. 术语解释与注意事项"
    ],
    事业: [
      "1. 事业格局：官禄宫、命宫、财帛宫、迁移宫综合",
      "2. 职业方向：适合行业、岗位形态、能力优势",
      "3. 工作模式：合作/独立、管理/执行、稳定/变化倾向",
      "4. 阶段机会：结合大限与流年说明近期发力点",
      "5. 风险与建议：沟通、人事、决策、节奏管理",
      "6. 术语解释与注意事项"
    ],
    财运: [
      "1. 财帛结构：财帛宫、官禄宫、福德宫、田宅宫综合",
      "2. 收入方式：主动收入、资源收入、专业变现能力",
      "3. 理财习惯：守财、花费、风险偏好、现金流建议",
      "4. 阶段趋势：结合大限与未来五年说明财富节奏",
      "5. 风险提醒：不得保证收益，给出现实配置边界",
      "6. 术语解释与注意事项"
    ],
    婚恋: [
      "1. 感情结构：夫妻宫、命宫、福德宫、子女宫综合",
      "2. 相处模式：吸引类型、沟通方式、亲密关系需求",
      "3. 关系挑战：冲突来源、边界问题、情绪模式",
      "4. 阶段趋势：结合大限与未来五年说明关系主题",
      "5. 现实建议：择偶、沟通、修复、长期经营建议",
      "6. 术语解释与注意事项"
    ],
    健康: [
      "1. 体质倾向：疾厄宫、命宫、福德宫综合",
      "2. 压力来源：工作、人际、作息和情绪消耗",
      "3. 养护方向：睡眠、运动、饮食、节奏管理建议",
      "4. 阶段提醒：结合大限与未来五年说明需留意的节奏",
      "5. 医疗边界：不得诊断，不适应就医检查",
      "6. 术语解释与注意事项"
    ],
    大限: [
      "1. 大限总览：各步大限顺序、宫位主题与四化重点",
      "2. 当前大限：机会、压力、应对策略",
      "3. 下一步大限：主题变化、提前准备",
      "4. 关键十年：事业、财帛、关系、健康的阶段节奏",
      "5. 行动建议：每个阶段的取舍、积累与风险控制",
      "6. 术语解释与注意事项"
    ],
    流年: [
      "1. 流年总览：流年命宫、小限命宫与三方四正",
      "2. 未来五年逐年分析：每年主题、机会、风险",
      "3. 事业财帛：逐年工作与资源节奏",
      "4. 婚恋人际：逐年关系与沟通重点",
      "5. 健康作息：逐年压力和养护建议",
      "6. 术语解释与注意事项"
    ]
  };

  return sections[focus];
}

function formatPalace(palace: ZiweiPalace) {
  const palaceTitle = palace.isBodyPalace ? `身｜${palace.palaceName}` : palace.palaceName;
  const mainStars = palace.mainStars.length ? palace.mainStars.join("、") : "空宫";
  const minorStars = palace.minorStars.length ? palace.minorStars.join("、") : "无";
  const transformations = palace.transformations.length ? palace.transformations.join("、") : "无";

  return [
    `${palace.branch}宫 ${palace.stem}${palace.branch} ${palaceTitle}`,
    `主星：${mainStars}`,
    `辅杂星：${minorStars}`,
    `四化：${transformations}`,
    `长生：${palace.changSheng}`,
    `大限年龄：${palace.ageRange}`,
    `流年年龄：${formatAgeList(palace.annualAges)}`,
    `小限年龄：${formatAgeList(palace.smallLimitAges)}`,
    `会照星曜摘要：${palace.sanfangImpact}`
  ].join("；");
}

function formatAgeList(ages: number[]) {
  return ages.join("、");
}
