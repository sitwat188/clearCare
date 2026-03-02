import { Controller, Get, Post, Put, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ComplianceService } from './compliance.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CreateComplianceDto } from './dto/create-compliance.dto';
import { UpdateComplianceDto } from './dto/update-compliance.dto';
import { UpdateMedicationAdherenceDto } from './dto/update-medication-adherence.dto';
import { UpdateLifestyleComplianceDto } from './dto/update-lifestyle-compliance.dto';

@ApiTags('compliance')
@ApiBearerAuth('access-token')
@Controller('compliance')
@UseGuards(JwtAuthGuard)
export class ComplianceController {
  constructor(private readonly complianceService: ComplianceService) {}

  @Post()
  @ApiOperation({ summary: 'Create compliance record' })
  async createComplianceRecord(
    @Body() createDto: CreateComplianceDto,
    @CurrentUser('id') requestingUserId: string,
    @CurrentUser('role') requestingUserRole: string,
  ) {
    return this.complianceService.createComplianceRecord(createDto, requestingUserId, requestingUserRole);
  }

  @Get()
  @ApiOperation({ summary: 'List compliance records' })
  async getComplianceRecords(
    @CurrentUser('id') requestingUserId: string,
    @CurrentUser('role') requestingUserRole: string,
    @Query('instructionId') instructionId?: string,
    @Query('patientId') patientId?: string,
    @Query('type') type?: string,
  ) {
    return this.complianceService.getComplianceRecords(requestingUserId, requestingUserRole, {
      instructionId,
      patientId,
      type,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get compliance record by ID' })
  async getComplianceRecord(
    @Param('id') recordId: string,
    @CurrentUser('id') requestingUserId: string,
    @CurrentUser('role') requestingUserRole: string,
  ) {
    return this.complianceService.getComplianceRecord(recordId, requestingUserId, requestingUserRole);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update compliance record' })
  async updateComplianceRecord(
    @Param('id') recordId: string,
    @Body() updateDto: UpdateComplianceDto,
    @CurrentUser('id') requestingUserId: string,
    @CurrentUser('role') requestingUserRole: string,
  ) {
    return this.complianceService.updateComplianceRecord(recordId, updateDto, requestingUserId, requestingUserRole);
  }

  @Put(':id/medication')
  @ApiOperation({ summary: 'Update medication adherence' })
  async updateMedicationAdherence(
    @Param('id') recordId: string,
    @Body() updateDto: UpdateMedicationAdherenceDto,
    @CurrentUser('id') requestingUserId: string,
    @CurrentUser('role') requestingUserRole: string,
  ) {
    return this.complianceService.updateMedicationAdherence(recordId, updateDto, requestingUserId, requestingUserRole);
  }

  @Put(':id/lifestyle')
  @ApiOperation({ summary: 'Update lifestyle compliance' })
  async updateLifestyleCompliance(
    @Param('id') recordId: string,
    @Body() updateDto: UpdateLifestyleComplianceDto,
    @CurrentUser('id') requestingUserId: string,
    @CurrentUser('role') requestingUserRole: string,
  ) {
    return this.complianceService.updateLifestyleCompliance(recordId, updateDto, requestingUserId, requestingUserRole);
  }

  @Get('metrics')
  @ApiOperation({ summary: 'Get compliance metrics' })
  async getComplianceMetrics(
    @CurrentUser('id') requestingUserId: string,
    @CurrentUser('role') requestingUserRole: string,
    @Query('patientId') patientId?: string,
    @Query('instructionId') instructionId?: string,
  ) {
    return this.complianceService.getComplianceMetrics(requestingUserId, requestingUserRole, {
      patientId,
      instructionId,
    });
  }
}
