import { Controller, Get, Post, Put, Body, Param, UseGuards, Req } from '@nestjs/common';
import type { Request } from 'express';
import { PatientsService } from './patients.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CreatePatientDto } from './dto/create-patient.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';

@Controller('patients')
@UseGuards(JwtAuthGuard) // All routes require authentication
export class PatientsController {
  constructor(private readonly patientsService: PatientsService) {}

  /**
   * Create a new patient record
   * POST /api/v1/patients
   * HIPAA: Admin only
   */
  @Post()
  async createPatient(
    @Body() createDto: CreatePatientDto,
    @CurrentUser('id') requestingUserId: string,
    @CurrentUser('role') requestingUserRole: string,
    @Req() req: Request,
  ) {
    const ipAddress = req.ip ?? req.socket?.remoteAddress ?? undefined;
    const userAgent = typeof req.headers['user-agent'] === 'string' ? req.headers['user-agent'] : undefined;
    return this.patientsService.createPatient(createDto, requestingUserId, requestingUserRole, ipAddress, userAgent);
  }

  /**
   * Get all patients (with access control)
   * GET /api/v1/patients
   */
  @Get()
  async getPatients(@CurrentUser('id') requestingUserId: string, @CurrentUser('role') requestingUserRole: string) {
    return this.patientsService.getPatients(requestingUserId, requestingUserRole);
  }

  /**
   * Get patient by user ID (admin only). Must be before :id so path is not captured.
   * GET /api/v1/patients/by-user/:userId
   */
  @Get('by-user/:userId')
  @UseGuards(RolesGuard)
  @Roles('administrator')
  async getPatientByUserId(@Param('userId') userId: string, @CurrentUser('role') requestingUserRole: string) {
    return this.patientsService.getPatientByUserId(userId, requestingUserRole);
  }

  /**
   * Get patient by ID
   * GET /api/v1/patients/:id
   */
  @Get(':id')
  async getPatient(
    @Param('id') patientId: string,
    @CurrentUser('id') requestingUserId: string,
    @CurrentUser('role') requestingUserRole: string,
  ) {
    return this.patientsService.getPatient(patientId, requestingUserId, requestingUserRole);
  }

  /**
   * Update patient record
   * PUT /api/v1/patients/:id
   */
  @Put(':id')
  async updatePatient(
    @Param('id') patientId: string,
    @Body() updateDto: UpdatePatientDto,
    @CurrentUser('id') requestingUserId: string,
    @CurrentUser('role') requestingUserRole: string,
    @Req() req: Request,
  ) {
    const ipAddress = req.ip ?? req.socket?.remoteAddress ?? undefined;
    const userAgent = typeof req.headers['user-agent'] === 'string' ? req.headers['user-agent'] : undefined;
    return this.patientsService.updatePatient(
      patientId,
      updateDto,
      requestingUserId,
      requestingUserRole,
      ipAddress,
      userAgent,
    );
  }
}
