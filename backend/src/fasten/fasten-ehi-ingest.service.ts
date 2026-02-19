/**
 * Ingest Fasten EHI export (NDJSON) into ClearCare DB.
 * Parses FHIR resources and writes to PatientHealth* tables.
 */

import { randomUUID } from 'crypto';
import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

interface FhirResource {
  resourceType?: string;
  id?: string;
  code?: { coding?: Array<{ code?: string; display?: string }>; text?: string };
  category?: Array<{
    coding?: Array<{ code?: string; display?: string }>;
    text?: string;
  }>;
  valueQuantity?: { value?: number; unit?: string };
  valueString?: string;
  valueCodeableConcept?: { text?: string };
  effectiveDateTime?: string;
  effectivePeriod?: { start?: string };
  medicationCodeableConcept?: {
    text?: string;
    coding?: Array<{ code?: string; display?: string }>;
  };
  medicationReference?: { display?: string };
  dosageInstruction?: Array<{
    text?: string;
    doseAndRate?: Array<{
      doseQuantity?: { value?: number; unit?: string };
      rateQuantity?: { value?: number; unit?: string };
    }>;
    timing?: {
      repeat?: { frequency?: number; period?: number; periodUnit?: string };
    };
  }>;
  status?: string;
  authoredOn?: string;
  clinicalStatus?: { coding?: Array<{ code?: string }> };
  onsetDateTime?: string;
  type?: Array<{ text?: string; coding?: Array<{ display?: string }> }>;
  period?: { start?: string; end?: string };
  reasonCode?: Array<{
    text?: string;
    coding?: Array<{ display?: string; code?: string }>;
  }>;
  serviceType?: {
    text?: string;
    coding?: Array<{ display?: string; code?: string }>;
  };
  [key: string]: unknown;
}

@Injectable()
export class FastenEhiIngestService {
  private readonly logger = new Logger(FastenEhiIngestService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Ingest NDJSON content for a given connection. Replaces all existing health data for this connection.
   */
  async ingestNdjson(
    ndjsonText: string,
    connectionId: string,
    patientId: string,
  ): Promise<{
    observations: number;
    medications: number;
    conditions: number;
    encounters: number;
  }> {
    const observations: Array<{
      id: string;
      connectionId: string;
      patientId: string;
      fhirId: string | null;
      code: string | null;
      display: string | null;
      category: string | null;
      value: string | null;
      unit: string | null;
      effectiveAt: Date | null;
      rawResource: Prisma.InputJsonValue;
    }> = [];
    const medications: Array<{
      id: string;
      connectionId: string;
      patientId: string;
      fhirId: string | null;
      name: string | null;
      dosage: string | null;
      status: string | null;
      prescribedAt: Date | null;
      rawResource: Prisma.InputJsonValue;
    }> = [];
    const conditions: Array<{
      id: string;
      connectionId: string;
      patientId: string;
      fhirId: string | null;
      code: string | null;
      display: string | null;
      clinicalStatus: string | null;
      onsetAt: Date | null;
      rawResource: Prisma.InputJsonValue;
    }> = [];
    const encounters: Array<{
      id: string;
      connectionId: string;
      patientId: string;
      fhirId: string | null;
      type: string | null;
      reasonText: string | null;
      serviceType: string | null;
      periodStart: Date | null;
      periodEnd: Date | null;
      rawResource: Prisma.InputJsonValue;
    }> = [];

    const lines = ndjsonText.split('\n').filter((line) => line.trim());
    for (const line of lines) {
      let resource: FhirResource;
      try {
        resource = JSON.parse(line) as FhirResource;
      } catch {
        continue;
      }
      const rt = resource.resourceType;
      if (rt === 'Observation')
        this.pushObservation(resource, connectionId, patientId, observations);
      else if (rt === 'MedicationRequest' || rt === 'MedicationStatement')
        this.pushMedication(resource, connectionId, patientId, medications);
      else if (rt === 'Condition')
        this.pushCondition(resource, connectionId, patientId, conditions);
      else if (rt === 'Encounter')
        this.pushEncounter(resource, connectionId, patientId, encounters);
    }

    const BATCH = 80;
    const timeoutMs = 30_000;
    try {
      await this.prisma.$transaction(
        async (tx) => {
          await tx.patientHealthObservation.deleteMany({
            where: { connectionId },
          });
          await tx.patientHealthMedication.deleteMany({
            where: { connectionId },
          });
          await tx.patientHealthCondition.deleteMany({
            where: { connectionId },
          });
          await tx.patientHealthEncounter.deleteMany({
            where: { connectionId },
          });

          for (let i = 0; i < observations.length; i += BATCH) {
            await tx.patientHealthObservation.createMany({
              data: observations.slice(i, i + BATCH),
            });
          }
          for (let i = 0; i < medications.length; i += BATCH) {
            await tx.patientHealthMedication.createMany({
              data: medications.slice(i, i + BATCH),
            });
          }
          for (let i = 0; i < conditions.length; i += BATCH) {
            await tx.patientHealthCondition.createMany({
              data: conditions.slice(i, i + BATCH),
            });
          }
          for (let i = 0; i < encounters.length; i += BATCH) {
            await tx.patientHealthEncounter.createMany({
              data: encounters.slice(i, i + BATCH),
            });
          }
        },
        { timeout: timeoutMs },
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (
        msg.includes('reason_text') ||
        msg.includes('service_type') ||
        msg.includes('column') ||
        msg.includes('does not exist')
      ) {
        this.logger.error(
          `EHI ingest failed (missing DB columns?). Run: npx prisma migrate deploy. Original: ${msg}`,
        );
      }
      throw err;
    }

    this.logger.log(
      `Ingested connection=${connectionId}: observations=${observations.length} medications=${medications.length} conditions=${conditions.length} encounters=${encounters.length}`,
    );
    return {
      observations: observations.length,
      medications: medications.length,
      conditions: conditions.length,
      encounters: encounters.length,
    };
  }

  private newId(): string {
    return randomUUID();
  }

  private parseDate(s: string | undefined): Date | null {
    if (!s) return null;
    const d = new Date(s);
    return isNaN(d.getTime()) ? null : d;
  }

  private pushObservation(
    r: FhirResource,
    connectionId: string,
    patientId: string,
    out: Array<{
      id: string;
      connectionId: string;
      patientId: string;
      fhirId: string | null;
      code: string | null;
      display: string | null;
      category: string | null;
      value: string | null;
      unit: string | null;
      effectiveAt: Date | null;
      rawResource: Prisma.InputJsonValue;
    }>,
  ): void {
    const code = r.code?.coding?.[0]?.code ?? r.code?.text ?? null;
    const display = r.code?.coding?.[0]?.display ?? r.code?.text ?? null;
    const cat = r.category?.[0];
    const category =
      cat?.coding?.[0]?.code ?? cat?.coding?.[0]?.display ?? cat?.text ?? null;
    let value: string | null = null;
    let unit: string | null = null;
    if (r.valueQuantity != null) {
      const v = r.valueQuantity.value;
      const u = r.valueQuantity.unit ?? '';
      unit = u || null;
      value = v != null ? `${v} ${u}`.trim() : null;
    } else if (typeof r.valueString === 'string') value = r.valueString;
    else if (r.valueCodeableConcept?.text) value = r.valueCodeableConcept.text;
    const effectiveAt = this.parseDate(
      r.effectiveDateTime ?? r.effectivePeriod?.start,
    );
    out.push({
      id: this.newId(),
      connectionId,
      patientId,
      fhirId: r.id ?? null,
      code,
      display,
      category,
      value,
      unit,
      effectiveAt,
      rawResource: r as unknown as Prisma.InputJsonValue,
    });
  }

  private pushMedication(
    r: FhirResource,
    connectionId: string,
    patientId: string,
    out: Array<{
      id: string;
      connectionId: string;
      patientId: string;
      fhirId: string | null;
      name: string | null;
      dosage: string | null;
      status: string | null;
      prescribedAt: Date | null;
      rawResource: Prisma.InputJsonValue;
    }>,
  ): void {
    const mc = r.medicationCodeableConcept;
    const ref = r.medicationReference;
    const name = mc?.text ?? mc?.coding?.[0]?.display ?? ref?.display ?? null;
    const status = r.status ?? null;
    const prescribedAt = this.parseDate(r.authoredOn ?? r.effectiveDateTime);
    let dosage: string | null = null;
    const di = r.dosageInstruction?.[0];
    if (di?.text) {
      dosage = di.text;
    } else if (di?.doseAndRate?.[0]) {
      const d = di.doseAndRate[0];
      const doseQ = d.doseQuantity;
      const parts: string[] = [];
      if (doseQ?.value != null)
        parts.push(`${doseQ.value} ${doseQ.unit ?? ''}`.trim());
      if (d.rateQuantity?.value != null)
        parts.push(
          `${d.rateQuantity.value} ${d.rateQuantity.unit ?? ''}/day`.trim(),
        );
      if (parts.length) dosage = parts.join(', ');
    }
    out.push({
      id: this.newId(),
      connectionId,
      patientId,
      fhirId: r.id ?? null,
      name,
      dosage,
      status,
      prescribedAt,
      rawResource: r as unknown as Prisma.InputJsonValue,
    });
  }

  private pushCondition(
    r: FhirResource,
    connectionId: string,
    patientId: string,
    out: Array<{
      id: string;
      connectionId: string;
      patientId: string;
      fhirId: string | null;
      code: string | null;
      display: string | null;
      clinicalStatus: string | null;
      onsetAt: Date | null;
      rawResource: Prisma.InputJsonValue;
    }>,
  ): void {
    const display = r.code?.text ?? r.code?.coding?.[0]?.display ?? null;
    const code = r.code?.coding?.[0]?.code ?? null;
    const clinicalStatus = r.clinicalStatus?.coding?.[0]?.code ?? null;
    const onsetAt = this.parseDate(r.onsetDateTime);
    out.push({
      id: this.newId(),
      connectionId,
      patientId,
      fhirId: r.id ?? null,
      code,
      display,
      clinicalStatus,
      onsetAt,
      rawResource: r as unknown as Prisma.InputJsonValue,
    });
  }

  private pushEncounter(
    r: FhirResource,
    connectionId: string,
    patientId: string,
    out: Array<{
      id: string;
      connectionId: string;
      patientId: string;
      fhirId: string | null;
      type: string | null;
      reasonText: string | null;
      serviceType: string | null;
      periodStart: Date | null;
      periodEnd: Date | null;
      rawResource: Prisma.InputJsonValue;
    }>,
  ): void {
    const type = r.type?.[0]?.text ?? r.type?.[0]?.coding?.[0]?.display ?? null;
    const reason = r.reasonCode?.[0];
    const reasonText = reason?.text ?? reason?.coding?.[0]?.display ?? null;
    const st = r.serviceType;
    const serviceType = st?.text ?? st?.coding?.[0]?.display ?? null;
    const periodStart = this.parseDate(r.period?.start);
    const periodEnd = this.parseDate(r.period?.end);
    out.push({
      id: this.newId(),
      connectionId,
      patientId,
      fhirId: r.id ?? null,
      type,
      reasonText,
      serviceType,
      periodStart,
      periodEnd,
      rawResource: r as unknown as Prisma.InputJsonValue,
    });
  }
}
