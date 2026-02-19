-- Observations: add category and unit for grouping/filtering
ALTER TABLE "patient_health_observations" ADD COLUMN "category" TEXT;
ALTER TABLE "patient_health_observations" ADD COLUMN "unit" TEXT;
CREATE INDEX "patient_health_observations_category_idx" ON "patient_health_observations"("category");

-- Medications: add dosage from dosageInstruction
ALTER TABLE "patient_health_medications" ADD COLUMN "dosage" TEXT;

-- Encounters: add reason and service type
ALTER TABLE "patient_health_encounters" ADD COLUMN "reason_text" TEXT;
ALTER TABLE "patient_health_encounters" ADD COLUMN "service_type" TEXT;
