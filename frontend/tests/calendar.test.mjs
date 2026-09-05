import test from "node:test";
import assert from "node:assert/strict";

import {
  buildCalendarDate,
  buildCalendarMonth,
  getChangedMonthBranch,
  getEarthlyBranch,
  shiftCalendarMonth
} from "../src/lib/calendar.ts";

test("calendar month starts on Sunday and always contains six complete weeks", () => {
  const days = buildCalendarMonth(2026, 9);

  assert.equal(days.length, 42);
  assert.equal(days[0].key, "2026-08-30");
  assert.equal(days[6].key, "2026-09-05");
  assert.equal(days[41].key, "2026-10-10");
});

test("calendar date includes lunar date, festivals, solar term, and three pillars", () => {
  const springFestival = buildCalendarDate(2024, 2, 10);
  const whiteDew = buildCalendarDate(2026, 9, 7);

  assert.equal(springFestival.lunarDateLabel, "农历正月初一");
  assert.deepEqual(springFestival.festivals, ["春节"]);
  assert.equal(springFestival.yearGanZhi, "甲辰");
  assert.equal(springFestival.monthGanZhi, "丙寅");
  assert.equal(springFestival.dayGanZhi, "甲辰");
  assert.equal(whiteDew.jieQi, "白露");
});

test("calendar navigation clamps to the supported 1900–2100 range", () => {
  assert.deepEqual(shiftCalendarMonth({ year: 1900, month: 1 }, -1), { year: 1900, month: 1 });
  assert.deepEqual(shiftCalendarMonth({ year: 2100, month: 12 }, 1), { year: 2100, month: 12 });
  assert.equal(buildCalendarMonth(1900, 1)[0].supported, false);
});

test("calendar detects the earthly branch when the solar-term month changes", () => {
  const beforeWhiteDew = buildCalendarDate(2026, 9, 6);
  const whiteDew = buildCalendarDate(2026, 9, 7);

  assert.equal(getEarthlyBranch(whiteDew.monthGanZhi), "酉");
  assert.equal(getChangedMonthBranch(whiteDew.monthGanZhi, beforeWhiteDew.monthGanZhi), "酉");
  assert.equal(getChangedMonthBranch(beforeWhiteDew.monthGanZhi, buildCalendarDate(2026, 9, 5).monthGanZhi), "");
});
