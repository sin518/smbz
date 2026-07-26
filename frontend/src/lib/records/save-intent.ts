export type SaveIntentType = "qimen" | "daliuren" | "ziwei" | "liuyao";

type SaveIntentStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;

export function markExplicitSaveIntent(
  type: SaveIntentType,
  occurrenceId: string,
  storage: SaveIntentStorage = window.sessionStorage
) {
  storage.setItem(keyFor(type), occurrenceId);
}

export function consumeExplicitSaveIntent(
  type: SaveIntentType,
  occurrenceId: string,
  storage: SaveIntentStorage = window.sessionStorage
) {
  if (storage.getItem(keyFor(type)) !== occurrenceId) {
    return false;
  }
  storage.removeItem(keyFor(type));
  return true;
}

function keyFor(type: SaveIntentType) {
  return `sm1:save-intent:${type}`;
}
