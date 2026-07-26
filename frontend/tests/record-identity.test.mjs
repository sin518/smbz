import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { buildRecordIdentity } from "../src/lib/records/record-identity.ts";

const vectors = JSON.parse(
  await readFile(new URL("../../docs/contracts/record-identity-v1-vectors.json", import.meta.url), "utf8"),
);

for (const vector of vectors) {
  test(`record identity: ${vector.name}`, async () => {
    const result = await buildRecordIdentity(vector.input);

    assert.deepEqual(result.canonical, vector.expectedCanonical);
    assert.equal(result.recordKey, vector.expectedRecordKey);
  });
}

test("bazi identity ignores equivalent calendar representation outside canonical input", async () => {
  const base = {
    type: "bazi",
    name: "测试",
    gender: "male",
    birthTime: "1994-05-03T02:02",
    locationKey: "广东省汕尾市陆河县",
    longitude: 115.656,
    latitude: 23.302,
    useSolarTime: true,
  };

  const left = await buildRecordIdentity(base);
  const right = await buildRecordIdentity({ ...base, birthTime: "1994-05-03 02:02:00" });

  assert.equal(left.recordKey, right.recordKey);
});

test("different bazi name or solar-time setting produces a different identity", async () => {
  const base = {
    type: "bazi",
    name: "测试",
    gender: "male",
    birthTime: "1994-05-03T02:02",
    locationKey: "广东省汕尾市陆河县",
    useSolarTime: true,
  };

  const original = await buildRecordIdentity(base);
  const renamed = await buildRecordIdentity({ ...base, name: "另一个人" });
  const standardTime = await buildRecordIdentity({ ...base, useSolarTime: false });

  assert.notEqual(original.recordKey, renamed.recordKey);
  assert.notEqual(original.recordKey, standardTime.recordKey);
});
