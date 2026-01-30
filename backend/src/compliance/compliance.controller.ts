import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ComplianceService } from './compliance.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CreateComplianceDto } from './dto/create-compliance.dto';
import { UpdateComplianceDto } from './dto/update-compliance.dto';
import { UpdateMedicationAdherenceDto } from './dto/update-medication-adherence.dto';
import { UpdateLifestyleComplianceDto } from './dto/update-lifestyle-compliance.dto';

@Controller('compliance')
@UseGuards(JwtAuthGuard) // All routes require authentication
export class ComplianceController {
  constructor(private readonly complianceService: ComplianceService) {}

  /**
   * Create compliance record
   * POST /api/v1/compliance
   */
  @Post()
  async createComplianceRecord(
    @Body() createDto: CreateComplianceDto,
    @CurrentUser('id') requestingUserId: string,
    @CurrentUser('role') requestingUserRole: string,
  ) {
    return this.complianceService.createComplianceRecord(
      createDto,
      requestingUserId,
      requestingUserRole,
    );
  }

  /**
   * Get all compliance records (with access control)
   * GET /api/v1/compliance
   */
  @Get()
  async getComplianceRecords(
    @CurrentUser('id') requestingUserId: string,
    @CurrentUser('role') requestingUserRole: string,
    @Query('instructionId') instructionId?: string,
    @Query('patientId') patientId?: string,
    @Query('type') type?: string,
  ) {
    return this.complianceService.getComplianceRecords(
      requestingUserId,
      requestingUserRole,
      {
        instructionId,
        patientId,
        type,
      },
    );
  }

  /**
   * Get compliance record by ID
   * GET /api/v1/compliance/:id
   */
  @Get(':id')
  async getComplianceRecord(
    @Param('id') recordId: string,
    @CurrentUser('id') requestingUserId: string,
    @CurrentUser('role') requestingUserRole: string,
  ) {
    return this.complianceService.getComplianceRecord(
      recordId,
      requestingUserId,
      requestingUserRole,
    );
  }

  /**
   * Update compliance record
   * PUT /api/v1/compliance/:id
   */
  @Put(':id')
  async updateComplianceRecord(
    @Param('id') recordId: string,
    @Body() updateDto: UpdateComplianceDto,
    @CurrentUser('id') requestingUserId: string,
    @CurrentUser('role') requestingUserRole: string,
  ) {
    return this.complianceService.updateComplianceRecord(
      recordId,
      updateDto,
      requestingUserId,
      requestingUserRole,
    );
  }

  /**
   * Update medication adherence
   * PUT /api/v1/compliance/:id/medication
   */
  @Put(':id/medication')
  async updateMedicationAdherence(
    @Param('id') recordId: string,
    @Body() updateDto: UpdateMedicationAdherenceDto,
    @CurrentUser('id') requestingUserId: string,
    @CurrentUser('role') requestingUserRole: string,
  ) {
    return this.complianceService.updateMedicationAdherence(
      recordId,
      updateDto,
      requestingUserId,
      requestingUserRole,
    );
  }

  /**
   * Update lifestyle compliance
   * PUT /api/v1/compliance/:id/lifestyle
   */
  @Put(':id/lifestyle')
  async updateLifestyleCompliance(
    @Param('id') recordId: string,
    @Body() updateDto: UpdateLifestyleComplianceDto,
    @CurrentUser('id') requestingUserId: string,
    @CurrentUser('role') requestingUserRole: string,
  ) {
    return this.complianceService.updateLifestyleCompliance(
      recordId,
      updateDto,
      requestingUserId,
      requestingUserRole,
    );
  }

  /**
   * Get compliance metrics/statistics
   * GET /api/v1/compliance/metrics
   */
  @Get('metrics')
  async getComplianceMetrics(
    @CurrentUser('id') requestingUserId: string,
    @CurrentUser('role') requestingUserRole: string,
    @Query('patientId') patientId?: string,
    @Query('instructionId') instructionId?: string,
  ) {
    return this.complianceService.getComplianceMetrics(
      requestingUserId,
      requestingUserRole,
      {
        patientId,
        instructionId,
      },
    );
  }
}
