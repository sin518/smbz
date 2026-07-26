import assert from "node:assert/strict";
import test from "node:test";

import {
  MemoryRecordStoreAdapter,
  PanRecordStore,
  RecordLifecycleConflictError
} from "../src/lib/records/record-store.ts";

function input(scope, overrides = {}) {
  return {
    scope,
    type: "qimen",
    recordKey: "qimen:v1:stable",
    identityVersion: 1,
    summary: { question: "测试" },
    payload: { chart: 1 },
    createdAt: "2026-07-01T00:00:00.000Z",
    ...overrides
  };
}

test("账号、游客与待认领空间完全隔离", async () => {
  const store = new PanRecordStore(new MemoryRecordStoreAdapter());
  await store.upsert(input("account:user-a"));
  await store.upsert(input("account:user-b"));
  await store.upsert(input("guest"));
  await store.upsert(input("legacy-unclaimed"));

  assert.equal((await store.list("account:user-a")).length, 1);
  assert.equal((await store.list("account:user-b")).length, 1);
  assert.equal((await store.list("guest")).length, 1);
  assert.equal((await store.list("legacy-unclaimed")).length, 1);
});

test("同一身份更新原记录并保留最早创建时间", async () => {
  const store = new PanRecordStore(new MemoryRecordStoreAdapter());
  const first = await store.upsert(input("account:user-a"));
  const second = await store.upsert(
    input("account:user-a", {
      id: "another-device-id",
      payload: { chart: 2 },
      createdAt: "2026-07-20T00:00:00.000Z"
    })
  );

  assert.equal(second.id, first.id);
  assert.equal(second.createdAt, "2026-07-01T00:00:00.000Z");
  assert.deepEqual(second.payload, { chart: 2 });
  assert.equal((await store.list("account:user-a")).length, 1);
});

test("读取严格只读，不改变更新时间或同步状态", async () => {
  const store = new PanRecordStore(new MemoryRecordStoreAdapter());
  const saved = await store.upsert(input("account:user-a"));
  const read = await store.get("account:user-a", saved.id);

  assert.equal(read?.updatedAt, saved.updatedAt);
  assert.equal(read?.syncStatus, "pending");
  assert.deepEqual(await store.list("account:user-a"), [saved]);
});

test("删除后后台写入不能复活，显式提交开启新生命周期", async () => {
  const store = new PanRecordStore(new MemoryRecordStoreAdapter());
  const saved = await store.upsert(input("account:user-a"));
  const deleted = await store.markDeleted("account:user-a", saved.id);

  await assert.rejects(
    () => store.upsert(input("account:user-a")),
    RecordLifecycleConflictError
  );

  const recreated = await store.upsert(input("account:user-a", { submissionMode: "explicit" }));
  assert.equal(recreated.lifecycleVersion, deleted.lifecycleVersion + 1);
  assert.equal(recreated.deletedAt, undefined);
});

test("存储层不静默截断未同步记录", async () => {
  const store = new PanRecordStore(new MemoryRecordStoreAdapter());
  for (let index = 0; index < 120; index += 1) {
    await store.upsert(
      input("account:user-a", {
        recordKey: `qimen:v1:${index}`,
        id: `local-${index}`
      })
    );
  }

  assert.equal((await store.list("account:user-a")).length, 120);
});

test("云端摘要可在相同更新时间下按需替换为完整内容", async () => {
  const store = new PanRecordStore(new MemoryRecordStoreAdapter());
  const remote = {
    id: "local-cloud-1",
    serverId: "server-1",
    scope: "account:user-a",
    type: "qimen",
    recordKey: "qimen:v1:remote",
    identityVersion: 1,
    summary: { payloadState: "summary" },
    payload: {},
    createdAt: "2026-07-01T00:00:00.000Z",
    updatedAt: "2026-07-02T00:00:00.000Z",
    syncStatus: "synced",
    origin: "cloud"
  };
  await store.cacheRemote(remote);
  await store.cacheRemote({
    ...remote,
    summary: { payloadState: "full" },
    payload: { chart: { complete: true } },
    replaceEqual: true
  });

  const record = await store.get("account:user-a", "local-cloud-1");
  assert.deepEqual(record?.payload, { chart: { complete: true } });
  assert.equal(record?.updatedAt, remote.updatedAt);
});
