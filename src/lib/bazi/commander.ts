import type { EarthlyBranch, HeavenlyStem } from "./index";

type Element = "木" | "火" | "土" | "金" | "水";

interface CommanderSegment {
  stem: HeavenlyStem;
  element: Element;
  days: number;
}

const COMMANDER_SEGMENTS: Record<EarthlyBranch, CommanderSegment[]> = {
  寅: [
    { stem: "戊", element: "土", days: 7 },
    { stem: "丙", element: "火", days: 7 },
    { stem: "甲", element: "木", days: 16 }
  ],
  卯: [
    { stem: "甲", element: "木", days: 10 },
    { stem: "乙", element: "木", days: 20 }
  ],
  辰: [
    { stem: "乙", element: "木", days: 9 },
    { stem: "癸", element: "水", days: 3 },
    { stem: "戊", element: "土", days: 18 }
  ],
  巳: [
    { stem: "戊", element: "土", days: 5 },
    { stem: "庚", element: "金", days: 9 },
    { stem: "丙", element: "火", days: 16 }
  ],
  午: [
    { stem: "丙", element: "火", days: 10 },
    { stem: "己", element: "土", days: 9 },
    { stem: "丁", element: "火", days: 11 }
  ],
  未: [
    { stem: "丁", element: "火", days: 9 },
    { stem: "乙", element: "木", days: 3 },
    { stem: "己", element: "土", days: 18 }
  ],
  申: [
    { stem: "戊", element: "土", days: 7 },
    { stem: "壬", element: "水", days: 3 },
    { stem: "庚", element: "金", days: 20 }
  ],
  酉: [
    { stem: "庚", element: "金", days: 10 },
    { stem: "辛", element: "金", days: 20 }
  ],
  戌: [
    { stem: "辛", element: "金", days: 9 },
    { stem: "丁", element: "火", days: 3 },
    { stem: "戊", element: "土", days: 18 }
  ],
  亥: [
    { stem: "戊", element: "土", days: 7 },
    { stem: "甲", element: "木", days: 5 },
    { stem: "壬", element: "水", days: 18 }
  ],
  子: [
    { stem: "壬", element: "水", days: 10 },
    { stem: "癸", element: "水", days: 20 }
  ],
  丑: [
    { stem: "癸", element: "水", days: 9 },
    { stem: "辛", element: "金", days: 3 },
    { stem: "己", element: "土", days: 18 }
  ]
};

export function getCommanderText(monthBranch: EarthlyBranch, minutesAfterJie: number) {
  const segments = COMMANDER_SEGMENTS[monthBranch];
  const dayIndex = Math.max(1, Math.floor(minutesAfterJie / 1440) + 1);
  let elapsed = 0;
  const active = segments.find((segment) => {
    elapsed += segment.days;
    return dayIndex <= elapsed;
  }) ?? segments[segments.length - 1];
  const fieldText = segments.map((segment) => `${segment.stem}${segment.days}`).join("");

  return `${fieldText}｜${active.stem}${active.element}用事`;
}
