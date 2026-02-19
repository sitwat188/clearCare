-- AlterTable: add export tracking to patient_health_connections
ALTER TABLE "patient_health_connections" ADD COLUMN "last_export_task_id" TEXT;
ALTER TABLE "patient_health_connections" ADD COLUMN "last_export_failure_reason" TEXT;

-- CreateTable: PatientHealthObservation
CREATE TABLE "patient_health_observations" (
    "id" TEXT NOT NULL,
    "connection_id" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "fhir_id" TEXT,
    "code" TEXT,
    "display" TEXT,
    "value" TEXT,
    "effective_at" TIMESTAMP(3),
    "raw_resource" JSONB,

    CONSTRAINT "patient_health_observations_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "patient_health_observations_connection_id_idx" ON "patient_health_observations"("connection_id");
CREATE INDEX "patient_health_observations_patient_id_idx" ON "patient_health_observations"("patient_id");

ALTER TABLE "patient_health_observations" ADD CONSTRAINT "patient_health_observations_connection_id_fkey" FOREIGN KEY ("connection_id") REFERENCES "patient_health_connections"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "patient_health_observations" ADD CONSTRAINT "patient_health_observations_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable: PatientHealthMedication
CREATE TABLE "patient_health_medications" (
    "id" TEXT NOT NULL,
    "connection_id" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "fhir_id" TEXT,
    "name" TEXT,
    "status" TEXT,
    "prescribed_at" TIMESTAMP(3),
    "raw_resource" JSONB,

    CONSTRAINT "patient_health_medications_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "patient_health_medications_connection_id_idx" ON "patient_health_medications"("connection_id");
CREATE INDEX "patient_health_medications_patient_id_idx" ON "patient_health_medications"("patient_id");

ALTER TABLE "patient_health_medications" ADD CONSTRAINT "patient_health_medications_connection_id_fkey" FOREIGN KEY ("connection_id") REFERENCES "patient_health_connections"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "patient_health_medications" ADD CONSTRAINT "patient_health_medications_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable: PatientHealthCondition
CREATE TABLE "patient_health_conditions" (
    "id" TEXT NOT NULL,
    "connection_id" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "fhir_id" TEXT,
    "code" TEXT,
    "display" TEXT,
    "clinical_status" TEXT,
    "onset_at" TIMESTAMP(3),
    "raw_resource" JSONB,

    CONSTRAINT "patient_health_conditions_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "patient_health_conditions_connection_id_idx" ON "patient_health_conditions"("connection_id");
CREATE INDEX "patient_health_conditions_patient_id_idx" ON "patient_health_conditions"("patient_id");

ALTER TABLE "patient_health_conditions" ADD CONSTRAINT "patient_health_conditions_connection_id_fkey" FOREIGN KEY ("connection_id") REFERENCES "patient_health_connections"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "patient_health_conditions" ADD CONSTRAINT "patient_health_conditions_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable: PatientHealthEncounter
CREATE TABLE "patient_health_encounters" (
    "id" TEXT NOT NULL,
    "connection_id" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "fhir_id" TEXT,
    "type" TEXT,
    "period_start" TIMESTAMP(3),
    "period_end" TIMESTAMP(3),
    "raw_resource" JSONB,

    CONSTRAINT "patient_health_encounters_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "patient_health_encounters_connection_id_idx" ON "patient_health_encounters"("connection_id");
CREATE INDEX "patient_health_encounters_patient_id_idx" ON "patient_health_encounters"("patient_id");

ALTER TABLE "patient_health_encounters" ADD CONSTRAINT "patient_health_encounters_connection_id_fkey" FOREIGN KEY ("connection_id") REFERENCES "patient_health_connections"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "patient_health_encounters" ADD CONSTRAINT "patient_health_encounters_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;
