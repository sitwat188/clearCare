-- Drop unique constraint on org_connection_id so the same connection can be linked to multiple patients
DROP INDEX IF EXISTS "patient_health_connections_org_connection_id_key";

-- Enforce one connection per patient: unique (patient_id, org_connection_id)
CREATE UNIQUE INDEX "patient_health_connections_patient_id_org_connection_id_key" ON "patient_health_connections"("patient_id", "org_connection_id");

-- Index for webhook lookups by org_connection_id
CREATE INDEX "patient_health_connections_org_connection_id_idx" ON "patient_health_connections"("org_connection_id");
