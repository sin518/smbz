CREATE TABLE IF NOT EXISTS "DivinationRecord" (
  id TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  "localId" TEXT NOT NULL,
  question TEXT NOT NULL DEFAULT '',
  summary TEXT NOT NULL DEFAULT '',
  detail TEXT NOT NULL DEFAULT '',
  payload JSONB NOT NULL,
  "occurredAt" TIMESTAMPTZ NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "DivinationRecord_type_check"
    CHECK (type IN ('liuyao', 'qimen', 'ziwei', 'daliuren')),
  UNIQUE ("userId", type, "localId")
);

CREATE INDEX IF NOT EXISTS "DivinationRecord_userId_occurredAt_idx"
  ON "DivinationRecord"("userId", "occurredAt" DESC);

ALTER TABLE "BaziProfile"
  ADD COLUMN IF NOT EXISTS "localId" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "BaziProfile_userId_localId_key"
  ON "BaziProfile"("userId", "localId")
  WHERE "localId" IS NOT NULL;
