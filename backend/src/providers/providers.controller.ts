import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Req, NotFoundException } from '@nestjs/common';
import type { Request } from 'express';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
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

@ApiTags('providers')
@ApiBearerAuth('access-token')
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

  @Get('reports')
  @ApiOperation({ summary: 'List provider reports' })
  getReports(@CurrentUser('id') userId: string, @CurrentUser('role') role: string) {
    if (role !== 'provider') return [];
    return this.reportsService.getReports(userId);
  }

  @Get('reports/:id')
  @ApiOperation({ summary: 'Get report by ID' })
  async getReportById(@Param('id') id: string, @CurrentUser('id') userId: string, @CurrentUser('role') role: string) {
    if (role !== 'provider') throw new NotFoundException('Report not found');
    const report = await this.reportsService.getReportById(id, userId);
    if (!report) throw new NotFoundException('Report not found');
    return report;
  }

  @Post('reports')
  @ApiOperation({ summary: 'Generate report' })
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

  @Get('templates')
  @ApiOperation({ summary: 'List templates' })
  async getTemplates(@CurrentUser('id') userId: string, @CurrentUser('role') role: string) {
    if (role !== 'provider') return [];
    return this.templatesService.getTemplates(userId);
  }

  @Post('templates')
  @ApiOperation({ summary: 'Create template' })
  async createTemplate(@CurrentUser('id') userId: string, @Body() dto: CreateTemplateDto) {
    return this.templatesService.createTemplate(userId, dto);
  }

  @Get('templates/:id')
  @ApiOperation({ summary: 'Get template by ID' })
  async getTemplate(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.templatesService.getTemplate(id, userId);
  }

  @Put('templates/:id')
  @ApiOperation({ summary: 'Update template' })
  async updateTemplate(@Param('id') id: string, @CurrentUser('id') userId: string, @Body() dto: UpdateTemplateDto) {
    return this.templatesService.updateTemplate(id, userId, dto);
  }

  @Delete('templates/:id')
  @ApiOperation({ summary: 'Delete template' })
  async deleteTemplate(@Param('id') id: string, @CurrentUser('id') userId: string) {
    await this.templatesService.deleteTemplate(id, userId);
  }

  @Get('instructions')
  @ApiOperation({ summary: 'List instructions for assigned patients' })
  async getInstructions(@CurrentUser('id') userId: string, @CurrentUser('role') role: string) {
    return this.instructionsService.getInstructions(userId, role, {});
  }

  @Get('instructions/:id')
  @ApiOperation({ summary: 'Get instruction by ID' })
  async getInstruction(@Param('id') id: string, @CurrentUser('id') userId: string, @CurrentUser('role') role: string) {
    return this.instructionsService.getInstruction(id, userId, role);
  }

  @Post('instructions')
  @ApiOperation({ summary: 'Create instruction' })
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

  @Put('instructions/:id')
  @ApiOperation({ summary: 'Update instruction' })
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

  @Delete('instructions/:id')
  @ApiOperation({ summary: 'Delete instruction' })
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

  @Get('patients')
  @ApiOperation({ summary: 'List patients (assigned for provider)' })
  async getPatients(@CurrentUser('id') userId: string, @CurrentUser('role') role: string) {
    return this.patientsService.getPatients(userId, role);
  }

  @Get('patients/:patientId/compliance/metrics')
  @ApiOperation({ summary: 'Get patient compliance metrics' })
  async getPatientComplianceMetrics(
    @Param('patientId') patientId: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: string,
  ) {
    return this.complianceService.getComplianceMetrics(userId, role, {
      patientId,
    });
  }

  @Get('patients/:patientId/compliance')
  @ApiOperation({ summary: 'Get patient compliance records' })
  async getPatientCompliance(
    @Param('patientId') patientId: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: string,
  ) {
    return this.complianceService.getComplianceRecords(userId, role, {
      patientId,
    });
  }

  @Get('patients/:id')
  @ApiOperation({ summary: 'Get patient by ID' })
  async getPatient(@Param('id') id: string, @CurrentUser('id') userId: string, @CurrentUser('role') role: string) {
    return this.patientsService.getPatient(id, userId, role);
  }
}
