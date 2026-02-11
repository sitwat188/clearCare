-- Normalization migration: safe for existing DB and data (idempotent where possible)
-- Run with: npx prisma migrate deploy (or migrate dev)

-- ---------------------------------------------------------------------------
-- 1. Patient – Provider junction (from assigned_provider_ids)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "patient_providers" (
    "patient_id" TEXT NOT NULL,
    "provider_id" TEXT NOT NULL,
    "assigned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "patient_providers_pkey" PRIMARY KEY ("patient_id","provider_id")
);

-- Migrate existing data; skip rows that would violate PK (idempotent)
INSERT INTO "patient_providers" ("patient_id", "provider_id")
SELECT p.id, unnest(p.assigned_provider_ids)
FROM "patients" p
WHERE p.assigned_provider_ids IS NOT NULL AND array_length(p.assigned_provider_ids, 1) > 0
ON CONFLICT ("patient_id", "provider_id") DO NOTHING;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'patient_providers_patient_id_fkey') THEN
    ALTER TABLE "patient_providers" ADD CONSTRAINT "patient_providers_patient_id_fkey"
      FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'patient_providers_provider_id_fkey') THEN
    ALTER TABLE "patient_providers" ADD CONSTRAINT "patient_providers_provider_id_fkey"
      FOREIGN KEY ("provider_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "patient_providers_provider_id_idx" ON "patient_providers"("provider_id");

ALTER TABLE "patients" DROP COLUMN IF EXISTS "assigned_provider_ids";

-- ---------------------------------------------------------------------------
-- 2. CareInstruction: drop redundant provider_name, patient_name; add provider FK
-- ---------------------------------------------------------------------------
ALTER TABLE "care_instructions" DROP COLUMN IF EXISTS "provider_name";
ALTER TABLE "care_instructions" DROP COLUMN IF EXISTS "patient_name";

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'care_instructions_provider_id_fkey') THEN
    ALTER TABLE "care_instructions" ADD CONSTRAINT "care_instructions_provider_id_fkey"
      FOREIGN KEY ("provider_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 3. Acknowledgment: drop redundant patient_id
-- ---------------------------------------------------------------------------
ALTER TABLE "acknowledgments" DROP COLUMN IF EXISTS "patient_id";
DROP INDEX IF EXISTS "acknowledgments_patient_id_idx";

-- ---------------------------------------------------------------------------
-- 4. ComplianceRecord: drop redundant patient_id
-- ---------------------------------------------------------------------------
ALTER TABLE "compliance_records" DROP COLUMN IF EXISTS "patient_id";
DROP INDEX IF EXISTS "compliance_records_patient_id_idx";

-- ---------------------------------------------------------------------------
-- 5. PasswordResetToken: replace email with user_id (preserve existing data)
-- ---------------------------------------------------------------------------
ALTER TABLE "password_reset_tokens" ADD COLUMN IF NOT EXISTS "user_id" TEXT;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'password_reset_tokens' AND column_name = 'email') THEN
    UPDATE "password_reset_tokens" prt
    SET "user_id" = u.id
    FROM "users" u
    WHERE prt."user_id" IS NULL AND u.email = prt.email AND u.deleted_at IS NULL;
  END IF;
END $$;

DELETE FROM "password_reset_tokens" WHERE "user_id" IS NULL;

ALTER TABLE "password_reset_tokens" ALTER COLUMN "user_id" SET NOT NULL;

ALTER TABLE "password_reset_tokens" DROP COLUMN IF EXISTS "email";
DROP INDEX IF EXISTS "password_reset_tokens_email_idx";

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'password_reset_tokens_user_id_fkey') THEN
    ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_user_id_fkey"
      FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "password_reset_tokens_user_id_idx" ON "password_reset_tokens"("user_id");

-- ---------------------------------------------------------------------------
-- 6. Notification: add FK to users (idempotent)
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'notifications_user_id_fkey') THEN
    ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey"
      FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 7. AuditLog: drop redundant user_email, user_name, resource_name (normalize)
-- ---------------------------------------------------------------------------
ALTER TABLE "audit_logs" DROP COLUMN IF EXISTS "user_email";
ALTER TABLE "audit_logs" DROP COLUMN IF EXISTS "user_name";
ALTER TABLE "audit_logs" DROP COLUMN IF EXISTS "resource_name";
