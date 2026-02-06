/**
 * Medplum integration controller
 * Health check (no auth) and FHIR endpoints (admin only).
 */

import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { MedplumService } from './medplum.service';

@Controller('medplum')
export class MedplumController {
  constructor(private readonly medplumService: MedplumService) {}

  /**
   * Health check for Medplum connection (no auth).
   * GET /api/v1/medplum/health
   */
  @Get('health')
  async getHealth() {
    await this.medplumService.ensureConnected();
    if (!this.medplumService.isConnected()) {
      return {
        status: 'ok',
        medplum: 'not_configured',
        message:
          'Medplum env not set. Add MEDPLUM_BASE_URL, MEDPLUM_CLIENT_ID, MEDPLUM_CLIENT_SECRET.',
      };
    }
    try {
      // Quick search to verify token works
      await this.medplumService.searchPatients({ _count: '1' });
      return {
        status: 'ok',
        medplum: 'connected',
      };
    } catch (err) {
      return {
        status: 'error',
        medplum: 'connected_but_error',
        error: err instanceof Error ? err.message : 'Unknown error',
      };
    }
  }

  /**
   * Search Patients in Medplum (admin and provider).
   * GET /api/v1/medplum/patients
   */
  @Get('patients')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('administrator', 'provider')
  async searchPatients(@Query() query: Record<string, string>) {
    if (!this.medplumService.isConnected()) {
      throw new BadRequestException(
        'Medplum not configured. Set MEDPLUM_BASE_URL, MEDPLUM_CLIENT_ID, MEDPLUM_CLIENT_SECRET.',
      );
    }
    return this.medplumService.searchPatients(query);
  }

  /**
   * Seed sample FHIR Patients in Medplum (admin and provider).
   * GET /api/v1/medplum/seed — use GET so it works even if POST is blocked (e.g. proxy).
   */
  @Get('seed')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('administrator', 'provider')
  async seedSamplePatients(): Promise<unknown[]> {
    if (!this.medplumService.isConnected()) {
      throw new BadRequestException(
        'Medplum not configured. Set MEDPLUM_BASE_URL, MEDPLUM_CLIENT_ID, MEDPLUM_CLIENT_SECRET.',
      );
    }
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call -- MedplumService returns Promise<unknown[]>
    const result: unknown[] = await this.medplumService.seedSamplePatients();
    return result;
  }

  /**
   * Get one Patient by id (admin and provider).
   * GET /api/v1/medplum/patients/:id
   */
  @Get('patients/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('administrator', 'provider')
  async getPatient(@Param('id') id: string): Promise<unknown> {
    if (!this.medplumService.isConnected()) {
      throw new BadRequestException(
        'Medplum not configured. Set MEDPLUM_BASE_URL, MEDPLUM_CLIENT_ID, MEDPLUM_CLIENT_SECRET.',
      );
    }
    return await this.medplumService.getPatient(id);
  }
}
