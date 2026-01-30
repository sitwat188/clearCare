-- AlterTable
ALTER TABLE "users" ADD COLUMN     "backupCodes" TEXT,
ADD COLUMN     "deleted_at" TIMESTAMP(3),
ADD COLUMN     "last_login_at" TIMESTAMP(3),
ADD COLUMN     "two_factor_enabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "two_factor_secret" TEXT;

-- CreateTable
CREATE TABLE "user_history" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "changed_by" TEXT,
    "old_values" JSONB,
    "new_values" JSONB,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "user_email" TEXT NOT NULL,
    "user_name" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "resource_type" TEXT NOT NULL,
    "resource_id" TEXT,
    "resource_name" TEXT,
    "ip_address" TEXT NOT NULL,
    "user_agent" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "details" JSONB,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "patients" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "date_of_birth" TEXT NOT NULL,
    "medical_record_number" TEXT NOT NULL,
    "phone" TEXT,
    "address_street" TEXT,
    "address_city" TEXT,
    "address_state" TEXT,
    "address_zip_code" TEXT,
    "emergency_contact_name" TEXT,
    "emergency_contact_relationship" TEXT,
    "emergency_contact_phone" TEXT,
    "assigned_provider_ids" TEXT[],
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "patients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "patient_history" (
    "id" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "changed_by" TEXT NOT NULL,
    "old_values" JSONB,
    "new_values" JSONB,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "patient_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "care_instructions" (
    "id" TEXT NOT NULL,
    "provider_id" TEXT NOT NULL,
    "provider_name" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "patient_name" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "priority" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "medication_details" JSONB,
    "lifestyle_details" JSONB,
    "follow_up_details" JSONB,
    "warning_details" JSONB,
    "assigned_date" TIMESTAMP(3) NOT NULL,
    "acknowledgment_deadline" TIMESTAMP(3),
    "acknowledged_date" TIMESTAMP(3),
    "expiration_date" TIMESTAMP(3),
    "compliance_tracking_enabled" BOOLEAN NOT NULL DEFAULT false,
    "lifestyle_tracking_enabled" BOOLEAN NOT NULL DEFAULT false,
    "version" INTEGER NOT NULL DEFAULT 1,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "care_instructions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "instruction_history" (
    "id" TEXT NOT NULL,
    "instruction_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "changed_by" TEXT NOT NULL,
    "old_values" JSONB,
    "new_values" JSONB,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "instruction_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "acknowledgments" (
    "id" TEXT NOT NULL,
    "instruction_id" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "acknowledgment_type" TEXT NOT NULL,
    "ip_address" TEXT NOT NULL,
    "user_agent" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "acknowledgments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "compliance_records" (
    "id" TEXT NOT NULL,
    "instruction_id" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "overall_percentage" DOUBLE PRECISION NOT NULL,
    "medication_adherence" JSONB,
    "lifestyle_compliance" JSONB,
    "appointment_compliance" JSONB,
    "last_updated_by" TEXT NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "compliance_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "priority" TEXT NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "action_url" TEXT,
    "action_label" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "user_history_user_id_idx" ON "user_history"("user_id");

-- CreateIndex
CREATE INDEX "user_history_created_at_idx" ON "user_history"("created_at");

-- CreateIndex
CREATE INDEX "audit_logs_user_id_idx" ON "audit_logs"("user_id");

-- CreateIndex
CREATE INDEX "audit_logs_resource_type_resource_id_idx" ON "audit_logs"("resource_type", "resource_id");

-- CreateIndex
CREATE INDEX "audit_logs_timestamp_idx" ON "audit_logs"("timestamp");

-- CreateIndex
CREATE INDEX "audit_logs_action_idx" ON "audit_logs"("action");

-- CreateIndex
CREATE UNIQUE INDEX "patients_user_id_key" ON "patients"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "patients_medical_record_number_key" ON "patients"("medical_record_number");

-- CreateIndex
CREATE INDEX "patients_user_id_idx" ON "patients"("user_id");

-- CreateIndex
CREATE INDEX "patients_deleted_at_idx" ON "patients"("deleted_at");

-- CreateIndex
CREATE INDEX "patient_history_patient_id_idx" ON "patient_history"("patient_id");

-- CreateIndex
CREATE INDEX "patient_history_created_at_idx" ON "patient_history"("created_at");

-- CreateIndex
CREATE INDEX "patient_history_changed_by_idx" ON "patient_history"("changed_by");

-- CreateIndex
CREATE INDEX "care_instructions_provider_id_idx" ON "care_instructions"("provider_id");

-- CreateIndex
CREATE INDEX "care_instructions_patient_id_idx" ON "care_instructions"("patient_id");

-- CreateIndex
CREATE INDEX "care_instructions_deleted_at_idx" ON "care_instructions"("deleted_at");

-- CreateIndex
CREATE INDEX "care_instructions_status_idx" ON "care_instructions"("status");

-- CreateIndex
CREATE INDEX "instruction_history_instruction_id_idx" ON "instruction_history"("instruction_id");

-- CreateIndex
CREATE INDEX "instruction_history_created_at_idx" ON "instruction_history"("created_at");

-- CreateIndex
CREATE INDEX "acknowledgments_instruction_id_idx" ON "acknowledgments"("instruction_id");

-- CreateIndex
CREATE INDEX "acknowledgments_patient_id_idx" ON "acknowledgments"("patient_id");

-- CreateIndex
CREATE INDEX "compliance_records_instruction_id_idx" ON "compliance_records"("instruction_id");

-- CreateIndex
CREATE INDEX "compliance_records_patient_id_idx" ON "compliance_records"("patient_id");

-- CreateIndex
CREATE INDEX "notifications_user_id_idx" ON "notifications"("user_id");

-- CreateIndex
CREATE INDEX "notifications_read_idx" ON "notifications"("read");

-- CreateIndex
CREATE INDEX "notifications_created_at_idx" ON "notifications"("created_at");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_deleted_at_idx" ON "users"("deleted_at");

-- AddForeignKey
ALTER TABLE "user_history" ADD CONSTRAINT "user_history_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patient_history" ADD CONSTRAINT "patient_history_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "care_instructions" ADD CONSTRAINT "care_instructions_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "instruction_history" ADD CONSTRAINT "instruction_history_instruction_id_fkey" FOREIGN KEY ("instruction_id") REFERENCES "care_instructions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "acknowledgments" ADD CONSTRAINT "acknowledgments_instruction_id_fkey" FOREIGN KEY ("instruction_id") REFERENCES "care_instructions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compliance_records" ADD CONSTRAINT "compliance_records_instruction_id_fkey" FOREIGN KEY ("instruction_id") REFERENCES "care_instructions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compliance_records" ADD CONSTRAINT "compliance_records_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
