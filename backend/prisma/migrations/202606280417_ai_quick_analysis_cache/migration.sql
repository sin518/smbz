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
);

CREATE INDEX IF NOT EXISTS "AiQuickAnalysisCache_userId_updatedAt_idx"
  ON "AiQuickAnalysisCache"("userId", "updatedAt" DESC);
