import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Req } from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { PatientsService } from '../patients/patients.service';
import { ComplianceService } from '../compliance/compliance.service';
import { InstructionsService } from '../instructions/instructions.service';
import { TemplatesService } from './templates.service';
import { ReportsService } from './reports.service';
import { CreateInstructionDto } from '../instructions/dto/create-instruction.dto';
import { UpdateInstructionDto } from '../instructions/dto/update-instruction.dto';
import { CreateTemplateDto } from './dto/create-template.dto';
import { UpdateTemplateDto } from './dto/update-template.dto';

/**
 * Provider-facing API: patients, instructions, compliance, reports, templates.
 */
@Controller('providers')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('provider')
export class ProvidersController {
  constructor(
    private readonly patientsService: PatientsService,
    private readonly complianceService: ComplianceService,
    private readonly instructionsService: InstructionsService,
    private readonly templatesService: TemplatesService,
    private readonly reportsService: ReportsService,
  ) {}

  /**
   * GET /api/v1/providers/reports
   */
  @Get('reports')
  getReports(@CurrentUser('id') userId: string, @CurrentUser('role') role: string) {
    if (role !== 'provider') return [];
    return this.reportsService.getReports(userId);
  }

  /**
   * POST /api/v1/providers/reports
   */
  @Post('reports')
  async generateReport(
    @CurrentUser('id') userId: string,
    @Body()
    body: {
      type: string;
      dateRange: { start: string; end: string };
      format: string;
    },
  ) {
    return this.reportsService.generateReport(userId, body);
  }

  /**
   * GET /api/v1/providers/templates
   */
  @Get('templates')
  async getTemplates(@CurrentUser('id') userId: string, @CurrentUser('role') role: string) {
    if (role !== 'provider') return [];
    return this.templatesService.getTemplates(userId);
  }

  /**
   * POST /api/v1/providers/templates
   */
  @Post('templates')
  async createTemplate(@CurrentUser('id') userId: string, @Body() dto: CreateTemplateDto) {
    return this.templatesService.createTemplate(userId, dto);
  }

  /**
   * GET /api/v1/providers/templates/:id
   */
  @Get('templates/:id')
  async getTemplate(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.templatesService.getTemplate(id, userId);
  }

  /**
   * PUT /api/v1/providers/templates/:id
   */
  @Put('templates/:id')
  async updateTemplate(@Param('id') id: string, @CurrentUser('id') userId: string, @Body() dto: UpdateTemplateDto) {
    return this.templatesService.updateTemplate(id, userId, dto);
  }

  /**
   * DELETE /api/v1/providers/templates/:id
   */
  @Delete('templates/:id')
  async deleteTemplate(@Param('id') id: string, @CurrentUser('id') userId: string) {
    await this.templatesService.deleteTemplate(id, userId);
  }

  /**
   * GET /api/v1/providers/instructions
   * List instructions (for assigned patients)
   */
  @Get('instructions')
  async getInstructions(@CurrentUser('id') userId: string, @CurrentUser('role') role: string) {
    return this.instructionsService.getInstructions(userId, role, {});
  }

  /**
   * GET /api/v1/providers/instructions/:id
   */
  @Get('instructions/:id')
  async getInstruction(@Param('id') id: string, @CurrentUser('id') userId: string, @CurrentUser('role') role: string) {
    return this.instructionsService.getInstruction(id, userId, role);
  }

  /**
   * POST /api/v1/providers/instructions
   */
  @Post('instructions')
  async createInstruction(
    @Body() body: CreateInstructionDto,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: string,
    @Req() req: Request,
  ) {
    const ipAddress = req.ip ?? req.socket?.remoteAddress ?? undefined;
    const userAgent = typeof req.headers['user-agent'] === 'string' ? req.headers['user-agent'] : undefined;
    return this.instructionsService.createInstruction(body, userId, role, ipAddress, userAgent);
  }

  /**
   * PUT /api/v1/providers/instructions/:id
   */
  @Put('instructions/:id')
  async updateInstruction(
    @Param('id') id: string,
    @Body() body: UpdateInstructionDto,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: string,
    @Req() req: Request,
  ) {
    const ipAddress = req.ip ?? req.socket?.remoteAddress ?? undefined;
    const userAgent = typeof req.headers['user-agent'] === 'string' ? req.headers['user-agent'] : undefined;
    return this.instructionsService.updateInstruction(id, body, userId, role, ipAddress, userAgent);
  }

  /**
   * DELETE /api/v1/providers/instructions/:id
   */
  @Delete('instructions/:id')
  async deleteInstruction(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: string,
    @Req() req: Request,
  ) {
    const ipAddress = req.ip ?? req.socket?.remoteAddress ?? undefined;
    const userAgent = typeof req.headers['user-agent'] === 'string' ? req.headers['user-agent'] : undefined;
    return this.instructionsService.deleteInstruction(id, userId, role, ipAddress, userAgent);
  }

  /**
   * GET /api/v1/providers/patients
   * List patients (access control: provider sees only assigned, admin sees all)
   */
  @Get('patients')
  async getPatients(@CurrentUser('id') userId: string, @CurrentUser('role') role: string) {
    return this.patientsService.getPatients(userId, role);
  }

  /**
   * GET /api/v1/providers/patients/:patientId/compliance/metrics
   * Must be before patients/:id so "compliance/metrics" is not captured as id
   */
  @Get('patients/:patientId/compliance/metrics')
  async getPatientComplianceMetrics(
    @Param('patientId') patientId: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: string,
  ) {
    return this.complianceService.getComplianceMetrics(userId, role, {
      patientId,
    });
  }

  /**
   * GET /api/v1/providers/patients/:patientId/compliance
   */
  @Get('patients/:patientId/compliance')
  async getPatientCompliance(
    @Param('patientId') patientId: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: string,
  ) {
    return this.complianceService.getComplianceRecords(userId, role, {
      patientId,
    });
  }

  /**
   * GET /api/v1/providers/patients/:id
   */
  @Get('patients/:id')
  async getPatient(@Param('id') id: string, @CurrentUser('id') userId: string, @CurrentUser('role') role: string) {
    return this.patientsService.getPatient(id, userId, role);
  }
}
