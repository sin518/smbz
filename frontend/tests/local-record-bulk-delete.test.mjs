import assert from "node:assert/strict";
import test from "node:test";

class MemoryStorage {
  constructor() {
    this.values = new Map();
    this.getCounts = new Map();
    this.setCounts = new Map();
  }

  getItem(key) {
    this.getCounts.set(key, (this.getCounts.get(key) ?? 0) + 1);
    return this.values.get(key) ?? null;
  }

  setItem(key, value) {
    this.setCounts.set(key, (this.setCounts.get(key) ?? 0) + 1);
    this.values.set(key, String(value));
  }

  resetMetrics() {
    this.getCounts.clear();
    this.setCounts.clear();
  }
}

const storage = new MemoryStorage();
globalThis.window = {
  localStorage: storage,
  setTimeout,
  clearTimeout,
  setInterval,
  clearInterval,
  addEventListener() {},
  removeEventListener() {},
};

const baziRecords = await import("../src/lib/bazi/local-records.ts");
const divinationRecords = await import("../src/lib/divination/local-records.ts");
const bulkDelete = await import("../src/lib/records/bulk-delete.ts");

function makeBaziRecord(index) {
  const timestamp = new Date(1_700_000_000_000 + index * 1_000).toISOString();
  return {
    id: `local-bazi-${index}`,
    serverId: index % 2 === 0 ? `server-bazi-${index}` : undefined,
    name: `测试${index}`,
    gender: "male",
    birthTime: "2000-01-01T12:00",
    calendar: "solar",
    useSolarTime: false,
    pillars: "甲子 乙丑 丙寅 丁卯",
    chartJson: { columns: [] },
    createdAt: timestamp,
    updatedAt: timestamp,
    syncStatus: index % 2 === 0 ? "synced" : "pending",
    origin: "record",
  };
}

function makeDivinationRecord(index) {
  const timestamp = new Date(1_700_000_000_000 + index * 1_000).toISOString();
  return {
    id: `local-liuyao-${index}`,
    serverId: index % 2 === 0 ? `server-liuyao-${index}` : undefined,
    type: "liuyao",
    question: `测试占事${index}`,
    summary: "六爻断事",
    detail: "摇卦",
    payload: { chart: {} },
    createdAt: timestamp,
    updatedAt: timestamp,
    sourceSavedAt: timestamp,
    syncStatus: index % 2 === 0 ? "synced" : "pending",
    origin: "local",
  };
}

test("批量删除八字记录时只读写一次本地记录和档案缓存", () => {
  const records = Array.from({ length: 300 }, (_, index) => makeBaziRecord(index));
  storage.setItem("sm1:bazi-records", JSON.stringify(records));
  storage.setItem("sm1:shared-profiles", "[]");
  storage.resetMetrics();

  const remaining = baziRecords.deleteLocalBaziRecords(records.map((record) => record.id));

  assert.equal(remaining.length, 0);
  assert.equal(storage.getCounts.get("sm1:bazi-records"), 1);
  assert.equal(storage.setCounts.get("sm1:bazi-records"), 1);
  assert.equal(storage.getCounts.get("sm1:shared-profiles"), 1);
  assert.equal(storage.setCounts.get("sm1:shared-profiles"), 1);
});

test("批量删除其他占术记录时只读写一次本地记录", () => {
  const records = Array.from({ length: 300 }, (_, index) => makeDivinationRecord(index));
  storage.setItem("sm1:divination-records", JSON.stringify(records));
  storage.resetMetrics();

  const remaining = divinationRecords.deleteLocalDivinationRecords(records.map((record) => record.id));

  assert.equal(remaining.length, 0);
  assert.equal(storage.getCounts.get("sm1:divination-records"), 1);
  assert.equal(storage.setCounts.get("sm1:divination-records"), 1);
});

test("同一云端记录集合只发送一次批量删除请求", async () => {
  const calls = [];
  globalThis.fetch = async (input, init) => {
    calls.push({ input: String(input), init });
    return new Response(
      JSON.stringify({
        deletedIds: ["server-1", "server-2", "unexpected-id"],
        missingIds: ["server-missing"],
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  };

  const resolvedIds = await bulkDelete.deleteCloudRecordsInBulk(
    "/api/sync/records",
    ["server-1", "server-2", "server-missing"],
  );

  assert.equal(calls.length, 1);
  assert.equal(calls[0].input, "/api/sync/records");
  assert.equal(calls[0].init.method, "DELETE");
  assert.deepEqual(JSON.parse(calls[0].init.body), {
    ids: ["server-1", "server-2", "server-missing"],
  });
  assert.deepEqual([...resolvedIds], ["server-1", "server-2", "server-missing"]);
});
