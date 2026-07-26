ALTER TABLE "BaziProfile"
  ADD COLUMN IF NOT EXISTS "recordKey" TEXT,
  ADD COLUMN IF NOT EXISTS "identityVersion" INTEGER,
  ADD COLUMN IF NOT EXISTS "calculationVersion" INTEGER,
  ADD COLUMN IF NOT EXISTS "lifecycleVersion" INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMPTZ;

ALTER TABLE "DivinationRecord"
  ADD COLUMN IF NOT EXISTS "recordKey" TEXT,
  ADD COLUMN IF NOT EXISTS "identityVersion" INTEGER,
  ADD COLUMN IF NOT EXISTS "calculationVersion" INTEGER,
  ADD COLUMN IF NOT EXISTS "lifecycleVersion" INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMPTZ;

CREATE UNIQUE INDEX IF NOT EXISTS "BaziProfile_userId_recordKey_active_key"
  ON "BaziProfile"("userId", "recordKey")
  WHERE "recordKey" IS NOT NULL AND "deletedAt" IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "DivinationRecord_userId_type_recordKey_active_key"
  ON "DivinationRecord"("userId", type, "recordKey")
  WHERE "recordKey" IS NOT NULL AND "deletedAt" IS NULL;

CREATE INDEX IF NOT EXISTS "BaziProfile_userId_deletedAt_updatedAt_idx"
  ON "BaziProfile"("userId", "deletedAt", "updatedAt" DESC);

CREATE INDEX IF NOT EXISTS "DivinationRecord_userId_deletedAt_occurredAt_idx"
  ON "DivinationRecord"("userId", "deletedAt", "occurredAt" DESC);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'BaziProfile_identity_versions_positive'
  ) THEN
    ALTER TABLE "BaziProfile"
      ADD CONSTRAINT "BaziProfile_identity_versions_positive"
      CHECK (
        ("identityVersion" IS NULL OR "identityVersion" > 0)
        AND ("calculationVersion" IS NULL OR "calculationVersion" > 0)
        AND "lifecycleVersion" > 0
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'DivinationRecord_identity_versions_positive'
  ) THEN
    ALTER TABLE "DivinationRecord"
      ADD CONSTRAINT "DivinationRecord_identity_versions_positive"
      CHECK (
        ("identityVersion" IS NULL OR "identityVersion" > 0)
        AND ("calculationVersion" IS NULL OR "calculationVersion" > 0)
        AND "lifecycleVersion" > 0
      );
  END IF;
END
$$;
