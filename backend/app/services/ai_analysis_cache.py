import json
from uuid import uuid4

import asyncpg

from app.schemas.ai_analysis import AiQuickAnalysisCachePutRequest, AiQuickAnalysisCacheResponse


async def ensure_ai_quick_analysis_cache_table(connection: asyncpg.Connection) -> None:
    await connection.execute(
        '''
        CREATE TABLE IF NOT EXISTS "AiQuickAnalysisCache" (
          id TEXT PRIMARY KEY,
          "userId" TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
          source TEXT NOT NULL,
          "requestHash" TEXT NOT NULL,
          "requestPayload" JSONB NOT NULL,
          "responseBody" JSONB NOT NULL,
          "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          UNIQUE ("userId", source, "requestHash")
        )
        '''
    )
    await connection.execute('CREATE INDEX IF NOT EXISTS "AiQuickAnalysisCache_userId_updatedAt_idx" ON "AiQuickAnalysisCache"("userId", "updatedAt" DESC)')


async def get_ai_quick_analysis_cache(
    connection: asyncpg.Connection,
    user_id: str,
    source: str,
    request_hash: str,
) -> AiQuickAnalysisCacheResponse | None:
    await ensure_ai_quick_analysis_cache_table(connection)
    row = await connection.fetchrow(
        '''
        SELECT source, "requestHash", "responseBody", "createdAt", "updatedAt"
        FROM "AiQuickAnalysisCache"
        WHERE "userId" = $1 AND source = $2 AND "requestHash" = $3
        LIMIT 1
        ''',
        user_id,
        source,
        request_hash,
    )

    return cache_response_from_row(row) if row else None


async def upsert_ai_quick_analysis_cache(
    connection: asyncpg.Connection,
    user_id: str,
    source: str,
    request_hash: str,
    body: AiQuickAnalysisCachePutRequest,
) -> AiQuickAnalysisCacheResponse:
    await ensure_ai_quick_analysis_cache_table(connection)
    row = await connection.fetchrow(
        '''
        INSERT INTO "AiQuickAnalysisCache" (
          id, "userId", source, "requestHash", "requestPayload", "responseBody", "createdAt", "updatedAt"
        )
        VALUES ($1, $2, $3, $4, $5::jsonb, $6::jsonb, NOW(), NOW())
        ON CONFLICT ("userId", source, "requestHash")
        DO UPDATE SET
          "requestPayload" = EXCLUDED."requestPayload",
          "responseBody" = EXCLUDED."responseBody",
          "updatedAt" = NOW()
        RETURNING source, "requestHash", "responseBody", "createdAt", "updatedAt"
        ''',
        str(uuid4()),
        user_id,
        source,
        request_hash,
        json.dumps(body.requestPayload, ensure_ascii=False),
        json.dumps(body.responseBody, ensure_ascii=False),
    )

    if not row:
        raise RuntimeError("保存 AI 分析缓存失败")

    return cache_response_from_row(row)


def cache_response_from_row(row: asyncpg.Record) -> AiQuickAnalysisCacheResponse:
    return AiQuickAnalysisCacheResponse(
        source=row["source"],
        requestHash=row["requestHash"],
        responseBody=normalize_json(row["responseBody"]),
        createdAt=row["createdAt"].isoformat(),
        updatedAt=row["updatedAt"].isoformat(),
    )


def normalize_json(value: object) -> dict[str, object]:
    if isinstance(value, str):
        parsed = json.loads(value)
        return parsed if isinstance(parsed, dict) else {}

    return value if isinstance(value, dict) else {}
