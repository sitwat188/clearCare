-- CreateTable
CREATE TABLE "generated_reports" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "generated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "generated_by" TEXT NOT NULL,
    "date_range_start" TIMESTAMP(3) NOT NULL,
    "date_range_end" TIMESTAMP(3) NOT NULL,
    "format" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "provider_id" TEXT,
    "payload" JSONB NOT NULL,

    CONSTRAINT "generated_reports_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "generated_reports_generated_by_idx" ON "generated_reports"("generated_by");

-- CreateIndex
CREATE INDEX "generated_reports_scope_generated_by_idx" ON "generated_reports"("scope", "generated_by");

-- CreateIndex
CREATE INDEX "generated_reports_generated_at_idx" ON "generated_reports"("generated_at");
