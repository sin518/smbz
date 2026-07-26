import test from "node:test";
import assert from "node:assert/strict";

import {
  buildDaliurenGongAriaLabel,
  formatDaliurenCourseLabel,
  getDaliurenHourBranch,
  getDaliurenTransmissionStates
} from "../src/lib/daliuren/plate.ts";

test("daliuren plate preserves every transmission when the same branch repeats", () => {
  const chart = {
    sanChuan: {
      chu: ["丑"],
      zhong: ["丑"],
      mo: ["丑"]
    }
  };

  assert.deepEqual(getDaliurenTransmissionStates(chart, "丑"), ["chu", "zhong", "mo"]);
  assert.deepEqual(getDaliurenTransmissionStates(chart, "午"), []);
});

test("daliuren plate extracts the hour branch and normalizes the course label", () => {
  assert.equal(getDaliurenHourBranch("甲午"), "午");
  assert.equal(getDaliurenHourBranch("甲 午"), "午");
  assert.equal(getDaliurenHourBranch(""), "-");
  assert.equal(formatDaliurenCourseLabel("伏吟", ""), "伏吟课");
  assert.equal(formatDaliurenCourseLabel("伏吟课", ""), "伏吟课");
  assert.equal(formatDaliurenCourseLabel("", "返吟"), "返吟课");
});

test("daliuren plate accessibility label contains hierarchy and stacked statuses", () => {
  const label = buildDaliurenGongAriaLabel({
    diZhi: "丑",
    tianZhi: "未",
    tianJiang: "天后",
    dunGan: "己",
    wangShuai: "休",
    changSheng: "胎",
    transmissionStates: ["chu", "zhong"],
    isKongWang: true
  });

  assert.match(label, /丑位，天盘未，天将天后，地盘丑/u);
  assert.match(label, /遁干己，旺衰休，十二长生胎/u);
  assert.match(label, /初传、中传，空亡/u);
});
