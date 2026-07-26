DROP INDEX IF EXISTS "DivinationRecord_userId_deletedAt_occurredAt_idx";
DROP INDEX IF EXISTS "BaziProfile_userId_deletedAt_updatedAt_idx";
DROP INDEX IF EXISTS "DivinationRecord_userId_type_recordKey_active_key";
DROP INDEX IF EXISTS "BaziProfile_userId_recordKey_active_key";

ALTER TABLE "DivinationRecord"
  DROP CONSTRAINT IF EXISTS "DivinationRecord_identity_versions_positive",
  DROP COLUMN IF EXISTS "deletedAt",
  DROP COLUMN IF EXISTS "lifecycleVersion",
  DROP COLUMN IF EXISTS "calculationVersion",
  DROP COLUMN IF EXISTS "identityVersion",
  DROP COLUMN IF EXISTS "recordKey";

ALTER TABLE "BaziProfile"
  DROP CONSTRAINT IF EXISTS "BaziProfile_identity_versions_positive",
  DROP COLUMN IF EXISTS "deletedAt",
  DROP COLUMN IF EXISTS "lifecycleVersion",
  DROP COLUMN IF EXISTS "calculationVersion",
  DROP COLUMN IF EXISTS "identityVersion",
  DROP COLUMN IF EXISTS "recordKey";
