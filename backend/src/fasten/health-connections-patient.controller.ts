import { Controller, Get, Post, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { HealthConnectionsService } from './health-connections.service';

/**
 * Provider/Admin: list health connections and status for a patient.
 * GET /api/v1/patients/:patientId/health-connections
 */
@Controller('patients/:patientId/health-connections')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('provider', 'administrator')
export class HealthConnectionsPatientController {
  constructor(private readonly healthConnections: HealthConnectionsService) {}

  @Get()
  async listConnections(
    @Param('patientId') patientId: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: string,
  ) {
    return this.healthConnections.listConnectionsForPatient(
      patientId,
      userId,
      role,
    );
  }

  @Get(':orgConnectionId/status')
  async getConnectionStatus(
    @Param('patientId') patientId: string,
    @Param('orgConnectionId') orgConnectionId: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: string,
  ) {
    await this.healthConnections.ensureCanAccessPatient(
      patientId,
      userId,
      role,
    );
    return this.healthConnections.getConnectionStatus(
      orgConnectionId,
      userId,
      role,
    );
  }

  @Post(':orgConnectionId/request-export')
  async requestEhiExport(
    @Param('patientId') patientId: string,
    @Param('orgConnectionId') orgConnectionId: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: string,
  ) {
    await this.healthConnections.ensureCanAccessPatient(
      patientId,
      userId,
      role,
    );
    return this.healthConnections.requestEhiExport(
      orgConnectionId,
      userId,
      role,
    );
  }
}
