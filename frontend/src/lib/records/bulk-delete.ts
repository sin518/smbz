export type BulkDeleteEndpoint = "/api/bazi/charts" | "/api/sync/records";

type BulkDeleteResponse = {
  deletedIds: string[];
  missingIds: string[];
};

const MAX_BATCH_SIZE = 500;
const REQUEST_TIMEOUT_MS = 25_000;

export async function deleteCloudRecordsInBulk(endpoint: BulkDeleteEndpoint, ids: Iterable<string>) {
  const requestedIds = [...new Set(ids)].filter(Boolean);
  const chunks: string[][] = [];

  for (let index = 0; index < requestedIds.length; index += MAX_BATCH_SIZE) {
    chunks.push(requestedIds.slice(index, index + MAX_BATCH_SIZE));
  }

  const results = await Promise.allSettled(chunks.map((chunk) => deleteCloudRecordChunk(endpoint, chunk)));
  const resolvedIds = new Set<string>();

  results.forEach((result) => {
    if (result.status === "fulfilled") {
      result.value.forEach((id) => resolvedIds.add(id));
    }
  });

  return resolvedIds;
}

async function deleteCloudRecordChunk(endpoint: BulkDeleteEndpoint, ids: string[]) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(endpoint, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ ids }),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error("云端批量删除失败");
    }

    const data = (await response.json()) as unknown;
    if (!isBulkDeleteResponse(data)) {
      throw new Error("云端批量删除响应格式错误");
    }

    const requestedSet = new Set(ids);
    return [...data.deletedIds, ...data.missingIds].filter((id) => requestedSet.has(id));
  } finally {
    clearTimeout(timeout);
  }
}

function isBulkDeleteResponse(value: unknown): value is BulkDeleteResponse {
  if (!value || typeof value !== "object") {
    return false;
  }

  const response = value as Record<string, unknown>;
  return isStringArray(response.deletedIds) && isStringArray(response.missingIds);
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}
