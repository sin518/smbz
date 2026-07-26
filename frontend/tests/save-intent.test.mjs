import assert from "node:assert/strict";
import test from "node:test";

import {
  consumeExplicitSaveIntent,
  markExplicitSaveIntent
} from "../src/lib/records/save-intent.ts";

function createStorage() {
  const values = new Map();
  return {
    getItem(key) {
      return values.get(key) ?? null;
    },
    setItem(key, value) {
      values.set(key, value);
    },
    removeItem(key) {
      values.delete(key);
    }
  };
}

test("没有明确提交令牌时，浏览结果不能触发保存", () => {
  const storage = createStorage();
  assert.equal(consumeExplicitSaveIntent("qimen", "event-1", storage), false);
});

test("令牌只匹配对应占术和事件，并且只能消费一次", () => {
  const storage = createStorage();
  markExplicitSaveIntent("liuyao", "casting-1", storage);

  assert.equal(consumeExplicitSaveIntent("qimen", "casting-1", storage), false);
  assert.equal(consumeExplicitSaveIntent("liuyao", "casting-2", storage), false);
  assert.equal(consumeExplicitSaveIntent("liuyao", "casting-1", storage), true);
  assert.equal(consumeExplicitSaveIntent("liuyao", "casting-1", storage), false);
});
