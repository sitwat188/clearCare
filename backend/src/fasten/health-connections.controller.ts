import { Controller, Get, Post, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { HealthConnectionsService } from './health-connections.service';
import { AddConnectionDto } from './dto/add-connection.dto';

/**
 * Patient "me" health connections: connect, list, remove.
 * GET/POST/DELETE /api/v1/patients/me/health-connections
 */
@Controller('patients/me/health-connections')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('patient')
export class HealthConnectionsMeController {
  constructor(private readonly healthConnections: HealthConnectionsService) {}

  @Get()
  async listMyConnections(@CurrentUser('id') userId: string, @CurrentUser('role') role: string) {
    return this.healthConnections.listMyConnections(userId, role);
  }

  /**
   * GET connect-url: URL to start Fasten Connect flow (redirect user here; they return to frontend callback with org_connection_id).
   */
  @Get('connect-url')
  getConnectUrl() {
    return this.healthConnections.getConnectUrl();
  }

  /**
   * GET health-data: imported observations, medications, conditions, encounters from Fasten EHI export.
   */
  @Get('health-data')
  async getMyHealthData(@CurrentUser('id') userId: string, @CurrentUser('role') role: string) {
    return this.healthConnections.getMyHealthData(userId, role);
  }

  @Post()
  async addConnection(
    @Body() dto: AddConnectionDto,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: string,
  ) {
    return this.healthConnections.addConnection(userId, role, dto.orgConnectionId, dto.sourceName);
  }

  @Delete(':orgConnectionId')
  async removeConnection(
    @Param('orgConnectionId') orgConnectionId: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: string,
  ) {
    return this.healthConnections.removeConnection(userId, role, orgConnectionId);
  }

  @Get(':orgConnectionId/status')
  async getConnectionStatus(
    @Param('orgConnectionId') orgConnectionId: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: string,
  ) {
    return this.healthConnections.getConnectionStatus(orgConnectionId, userId, role);
  }
}
