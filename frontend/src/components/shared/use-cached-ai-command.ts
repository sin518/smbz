"use client";

// 需要 useEffect/useState 在浏览器会话内复用首次生成的 AI 指令。
import { useEffect, useState } from "react";

const AI_COMMAND_CACHE_PREFIX = "sm1:ai-command";

type CachedAiCommand = {
  signature: string;
  text: string;
};

export function useCachedAiCommand({
  namespace,
  source,
  build
}: {
  namespace: string;
  source: string;
  build: () => string;
}) {
  const [cachedCommand, setCachedCommand] = useState<CachedAiCommand | null>(null);
  const signature = createSourceSignature(source);

  useEffect(() => {
    let cancelled = false;
    const storageKey = `${AI_COMMAND_CACHE_PREFIX}:${namespace}:${signature}`;
    const storedText = readCachedCommand(storageKey);
    const nextCommand = { signature, text: storedText ?? build() };

    if (storedText === null) {
      writeCachedCommand(storageKey, nextCommand.text);
    }

    if (!cancelled) {
      setCachedCommand(nextCommand);
    }

    return () => {
      cancelled = true;
    };
  }, [build, namespace, signature]);

  return cachedCommand?.signature === signature ? cachedCommand.text : "";
}

function readCachedCommand(storageKey: string) {
  try {
    return window.sessionStorage.getItem(storageKey);
  } catch {
    return null;
  }
}

function writeCachedCommand(storageKey: string, commandText: string) {
  try {
    window.sessionStorage.setItem(storageKey, commandText);
  } catch {
    // Storage may be unavailable or full; the in-memory value still remains stable for this mount.
  }
}

function createSourceSignature(value: string) {
  return `${value.length.toString(36)}-${hashText(value, 2166136261)}-${hashText(value, 3339675911)}`;
}

function hashText(value: string, seed: number) {
  let hash = seed;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return (hash >>> 0).toString(36);
}
