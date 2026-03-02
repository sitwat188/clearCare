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
  NotFoundException,
} from '@nestjs/common';
import type { Request } from 'express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AdminService } from './admin.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@ApiTags('admin')
@ApiBearerAuth('access-token')
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('administrator')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('users')
  @ApiOperation({ summary: 'List all users (active and inactive)' })
  @ApiResponse({ status: 200, description: 'List of users' })
  async getUsers() {
    return this.adminService.getUsers();
  }

  /**
   * Get patient record for a user (admin only). Must be before users/:id.
   * GET /api/v1/admin/users/:userId/patient
   */
  @Get('users/:userId/patient')
  @ApiOperation({ summary: 'Get patient record by user ID' })
  async getPatientByUserId(@Param('userId') userId: string) {
    return this.adminService.getPatientByUserId(userId);
  }

  @Get('users/:id')
  @ApiOperation({ summary: 'Get user by ID' })
  async getUser(@Param('id') id: string) {
    return this.adminService.getUser(id);
  }

  @Post('users')
  @ApiOperation({ summary: 'Create user (invitation flow)' })
  @ApiResponse({ status: 201, description: 'User created' })
  @ApiResponse({ status: 409, description: 'Email exists or inactive user' })
  async createUser(@Body() dto: CreateUserDto, @CurrentUser('id') adminUserId: string, @Req() req: Request) {
    const ipAddress = req.ip ?? req.socket?.remoteAddress ?? undefined;
    const userAgent = typeof req.headers['user-agent'] === 'string' ? req.headers['user-agent'] : undefined;
    return this.adminService.createUser(dto, adminUserId, ipAddress, userAgent);
  }

  @Put('users/:id')
  @ApiOperation({ summary: 'Update user' })
  async updateUser(
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
    @CurrentUser('id') adminUserId: string,
    @Req() req: Request,
  ) {
    const ipAddress = req.ip ?? req.socket?.remoteAddress ?? undefined;
    const userAgent = typeof req.headers['user-agent'] === 'string' ? req.headers['user-agent'] : undefined;
    return this.adminService.updateUser(id, dto, adminUserId, ipAddress, userAgent);
  }

  @Delete('users/:id')
  @ApiOperation({ summary: 'Soft-delete user' })
  async deleteUser(@Param('id') id: string, @CurrentUser('id') adminUserId: string, @Req() req: Request) {
    const ipAddress = req.ip ?? req.socket?.remoteAddress ?? undefined;
    const userAgent = typeof req.headers['user-agent'] === 'string' ? req.headers['user-agent'] : undefined;
    await this.adminService.deleteUser(id, adminUserId, ipAddress, userAgent);
  }

  /**
   * Manually restore a soft-deleted user (and linked patient). Admin only; never auto-restored on create.
   * POST /api/v1/admin/users/:id/restore
   */
  @Post('users/:id/restore')
  @ApiOperation({ summary: 'Restore soft-deleted user' })
  async restoreUser(@Param('id') id: string, @CurrentUser('id') adminUserId: string, @Req() req: Request) {
    const ipAddress = req.ip ?? req.socket?.remoteAddress ?? undefined;
    const userAgent = typeof req.headers['user-agent'] === 'string' ? req.headers['user-agent'] : undefined;
    return this.adminService.restoreUser(id, adminUserId, ipAddress, userAgent);
  }

  @Get('roles')
  @ApiOperation({ summary: 'List roles with user counts' })
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
  @ApiOperation({ summary: 'List audit logs with filters' })
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
  @ApiOperation({ summary: 'Get system settings' })
  getSystemSettings() {
    return this.adminService.getSystemSettings();
  }

  @Put('settings')
  updateSystemSettings(@Body() updates: Record<string, unknown>) {
    return this.adminService.updateSystemSettings(updates);
  }

  @Get('reports')
  @ApiOperation({ summary: 'List generated reports' })
  getReports() {
    return this.adminService.getReports();
  }

  @Get('reports/:id')
  @ApiOperation({ summary: 'Get report by ID (payload for download)' })
  async getReportById(@Param('id') id: string) {
    const report = await this.adminService.getReportById(id);
    if (!report) {
      throw new NotFoundException('Report not found');
    }
    return report;
  }

  @Post('reports')
  @ApiOperation({ summary: 'Generate and store a report' })
  generateReport(
    @Body()
    reportConfig: {
      type: string;
      dateRange: { start: string; end: string };
      format: string;
    },
    @CurrentUser('id') adminUserId: string,
  ) {
    return this.adminService.generateReport(reportConfig, adminUserId);
  }
}
