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
  BadGatewayException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { MedplumService } from './medplum.service';

@Controller('medplum')
export class MedplumController {
  constructor(private readonly medplumService: MedplumService) {}

  /**
   * Root: list available Medplum API paths (no auth). GET /api/v1/medplum
   */
  @Get()
  getMedplumRoot() {
    return {
      medplum: 'ok',
      paths: [
        'GET /api/v1/medplum/health',
        'GET /api/v1/medplum/patients',
        'GET /api/v1/medplum/patients/:id',
        'GET /api/v1/medplum/practitioners',
        'GET /api/v1/medplum/practitioners/:id',
        'GET /api/v1/medplum/tasks',
        'GET /api/v1/medplum/tasks/:id',
        'GET /api/v1/medplum/seed',
      ],
    };
  }

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
   * Search Practitioners in Medplum (admin and provider).
   * GET /api/v1/medplum/practitioners
   */
  @Get('practitioners')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('administrator', 'provider')
  async searchPractitioners(@Query() query: Record<string, string>) {
    if (!this.medplumService.isConnected()) {
      throw new BadRequestException(
        'Medplum not configured. Set MEDPLUM_BASE_URL, MEDPLUM_CLIENT_ID, MEDPLUM_CLIENT_SECRET.',
      );
    }
    try {
      return await this.medplumService.searchPractitioners(query);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : 'Medplum practitioners request failed';
      throw new BadGatewayException(`Medplum: ${message}`);
    }
  }

  /**
   * Search Tasks (instructions/orders) in Medplum.
   * GET /api/v1/medplum/tasks
   */
  @Get('tasks')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('administrator', 'provider')
  async searchTasks(@Query() query: Record<string, string>) {
    if (!this.medplumService.isConnected()) {
      throw new BadRequestException(
        'Medplum not configured. Set MEDPLUM_BASE_URL, MEDPLUM_CLIENT_ID, MEDPLUM_CLIENT_SECRET.',
      );
    }
    try {
      return await this.medplumService.searchTasks(query);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Medplum tasks request failed';
      throw new BadGatewayException(`Medplum: ${message}`);
    }
  }

  /**
   * Seed sample FHIR Patients in Medplum (admin and provider).
   * GET /api/v1/medplum/seed
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

  /**
   * Get one Practitioner by id.
   * GET /api/v1/medplum/practitioners/:id
   */
  @Get('practitioners/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('administrator', 'provider')
  async getPractitioner(@Param('id') id: string): Promise<unknown> {
    if (!this.medplumService.isConnected()) {
      throw new BadRequestException(
        'Medplum not configured. Set MEDPLUM_BASE_URL, MEDPLUM_CLIENT_ID, MEDPLUM_CLIENT_SECRET.',
      );
    }
    try {
      return await this.medplumService.getPractitioner(id);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : 'Medplum practitioner request failed';
      throw new BadGatewayException(`Medplum: ${message}`);
    }
  }

  /**
   * Get one Task by id.
   * GET /api/v1/medplum/tasks/:id
   */
  @Get('tasks/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('administrator', 'provider')
  async getTask(@Param('id') id: string): Promise<unknown> {
    if (!this.medplumService.isConnected()) {
      throw new BadRequestException(
        'Medplum not configured. Set MEDPLUM_BASE_URL, MEDPLUM_CLIENT_ID, MEDPLUM_CLIENT_SECRET.',
      );
    }
    try {
      return await this.medplumService.getTask(id);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Medplum task request failed';
      throw new BadGatewayException(`Medplum: ${message}`);
    }
  }
}
