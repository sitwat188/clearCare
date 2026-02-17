-- CreateTable
CREATE TABLE "patient_health_connections" (
    "id" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "org_connection_id" TEXT NOT NULL,
    "source_name" TEXT,
    "connected_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_synced_at" TIMESTAMP(3),

    CONSTRAINT "patient_health_connections_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "patient_health_connections_org_connection_id_key" ON "patient_health_connections"("org_connection_id");

-- CreateIndex
CREATE INDEX "patient_health_connections_patient_id_idx" ON "patient_health_connections"("patient_id");

-- AddForeignKey
ALTER TABLE "patient_health_connections" ADD CONSTRAINT "patient_health_connections_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;
