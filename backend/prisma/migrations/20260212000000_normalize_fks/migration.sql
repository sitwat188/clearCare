-- Further normalization: add missing foreign keys for referential integrity
-- Safe for existing data: orphaned IDs are set to NULL before adding FKs

-- 1. UserHistory.changed_by -> users(id) ON DELETE SET NULL (column already nullable)
UPDATE "user_history" uh
SET "changed_by" = NULL
WHERE uh."changed_by" IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM "users" u WHERE u.id = uh."changed_by");

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'user_history_changed_by_fkey') THEN
    ALTER TABLE "user_history" ADD CONSTRAINT "user_history_changed_by_fkey"
      FOREIGN KEY ("changed_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "user_history_changed_by_idx" ON "user_history"("changed_by");

-- 2. PatientHistory.changed_by: allow NULL, clean orphans, add FK
UPDATE "patient_history" ph
SET "changed_by" = NULL
WHERE ph."changed_by" IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM "users" u WHERE u.id = ph."changed_by");

ALTER TABLE "patient_history" ALTER COLUMN "changed_by" DROP NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'patient_history_changed_by_fkey') THEN
    ALTER TABLE "patient_history" ADD CONSTRAINT "patient_history_changed_by_fkey"
      FOREIGN KEY ("changed_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- 3. InstructionHistory.changed_by: allow NULL, clean orphans, add FK
UPDATE "instruction_history" ih
SET "changed_by" = NULL
WHERE ih."changed_by" IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM "users" u WHERE u.id = ih."changed_by");

ALTER TABLE "instruction_history" ALTER COLUMN "changed_by" DROP NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'instruction_history_changed_by_fkey') THEN
    ALTER TABLE "instruction_history" ADD CONSTRAINT "instruction_history_changed_by_fkey"
      FOREIGN KEY ("changed_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "instruction_history_changed_by_idx" ON "instruction_history"("changed_by");

-- 4. ComplianceRecord.last_updated_by: allow NULL, clean orphans, add FK
UPDATE "compliance_records" cr
SET "last_updated_by" = NULL
WHERE cr."last_updated_by" IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM "users" u WHERE u.id = cr."last_updated_by");

ALTER TABLE "compliance_records" ALTER COLUMN "last_updated_by" DROP NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'compliance_records_last_updated_by_fkey') THEN
    ALTER TABLE "compliance_records" ADD CONSTRAINT "compliance_records_last_updated_by_fkey"
      FOREIGN KEY ("last_updated_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "compliance_records_last_updated_by_idx" ON "compliance_records"("last_updated_by");

-- 5. InstructionTemplate.provider_id -> users(id) ON DELETE CASCADE
-- Remove any templates whose provider no longer exists before adding FK
DELETE FROM "instruction_templates" it
WHERE NOT EXISTS (SELECT 1 FROM "users" u WHERE u.id = it."provider_id");

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'instruction_templates_provider_id_fkey') THEN
    ALTER TABLE "instruction_templates" ADD CONSTRAINT "instruction_templates_provider_id_fkey"
      FOREIGN KEY ("provider_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
