import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

/**
 * Body for dev-only manual ingest. NDJSON lines (one FHIR resource per line).
 * Only available when NODE_ENV !== 'production' or ALLOW_DEV_INGEST=true.
 */
export class DevIngestDto {
  @ApiProperty({ description: 'NDJSON content (one FHIR resource per line)' })
  @IsString()
  ndjson!: string;
}
