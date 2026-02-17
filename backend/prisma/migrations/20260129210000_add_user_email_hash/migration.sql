-- Add email_hash for lookup (encrypted email at rest); drop unique on email so we can store ciphertext
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "email_hash" TEXT;

-- Backfill: hash existing emails so login can find by email_hash
UPDATE "users"
SET "email_hash" = encode(sha256(lower(trim("email"))::bytea), 'hex')
WHERE "email_hash" IS NULL;

-- Unique constraint on email_hash for lookups
CREATE UNIQUE INDEX IF NOT EXISTS "users_email_hash_key" ON "users"("email_hash");

-- Drop unique on email (encrypted value will not be unique per value)
ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "users_email_key";

-- Index for listing/filtering by email_hash
CREATE INDEX IF NOT EXISTS "users_email_hash_idx" ON "users"("email_hash");
