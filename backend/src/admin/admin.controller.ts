import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AdminService } from './admin.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('administrator')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('users')
  async getUsers() {
    return this.adminService.getUsers();
  }

  /**
   * Get patient record for a user (admin only). Must be before users/:id.
   * GET /api/v1/admin/users/:userId/patient
   */
  @Get('users/:userId/patient')
  async getPatientByUserId(@Param('userId') userId: string) {
    return this.adminService.getPatientByUserId(userId);
  }

  @Get('users/:id')
  async getUser(@Param('id') id: string) {
    return this.adminService.getUser(id);
  }

  @Post('users')
  async createUser(
    @Body() dto: CreateUserDto,
    @CurrentUser('id') adminUserId: string,
    @Req() req: any,
  ) {
    const ipAddress = req.ip || req.connection?.remoteAddress;
    const userAgent = req.headers['user-agent'];
    return this.adminService.createUser(dto, adminUserId, ipAddress, userAgent);
  }

  @Put('users/:id')
  async updateUser(
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
    @CurrentUser('id') adminUserId: string,
    @Req() req: any,
  ) {
    const ipAddress = req.ip || req.connection?.remoteAddress;
    const userAgent = req.headers['user-agent'];
    return this.adminService.updateUser(id, dto, adminUserId, ipAddress, userAgent);
  }

  @Delete('users/:id')
  async deleteUser(
    @Param('id') id: string,
    @CurrentUser('id') adminUserId: string,
    @Req() req: any,
  ) {
    const ipAddress = req.ip || req.connection?.remoteAddress;
    const userAgent = req.headers['user-agent'];
    await this.adminService.deleteUser(id, adminUserId, ipAddress, userAgent);
  }

  @Get('roles')
  async getRoles() {
    return this.adminService.getRoles();
  }

  @Get('roles/:id')
  async getRole(@Param('id') id: string) {
    return this.adminService.getRole(id);
  }

  @Post('roles')
  createRole() {
    return this.adminService.createRoleStub();
  }

  @Put('roles/:id')
  updateRole() {
    return this.adminService.updateRoleStub();
  }

  @Delete('roles/:id')
  deleteRole() {
    return this.adminService.deleteRoleStub();
  }

  @Get('audit-logs/count')
  async getAuditLogsCount() {
    return this.adminService.getAuditLogsCount();
  }

  @Get('audit-logs')
  async getAuditLogs(
    @Query('userId') userId?: string,
    @Query('action') action?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const filters = {
      userId,
      action,
      startDate,
      endDate,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    };
    return this.adminService.getAuditLogs(filters);
  }

  @Get('settings')
  async getSystemSettings() {
    return this.adminService.getSystemSettings();
  }

  @Put('settings')
  async updateSystemSettings(@Body() updates: Record<string, unknown>) {
    return this.adminService.updateSystemSettings(updates);
  }

  @Get('reports')
  async getReports() {
    return this.adminService.getReports();
  }

  @Post('reports')
  async generateReport(
    @Body() reportConfig: { type: string; dateRange: { start: string; end: string }; format: string },
    @CurrentUser('id') adminUserId: string,
  ) {
    return this.adminService.generateReport(reportConfig, adminUserId);
  }
}
