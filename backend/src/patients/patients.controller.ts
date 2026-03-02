import { Controller, Get, Post, Put, Body, Param, UseGuards, Req } from '@nestjs/common';
import type { Request } from 'express';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PatientsService } from './patients.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CreatePatientDto } from './dto/create-patient.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';

/** @deprecated Prefer role-prefixed routes: GET/PUT /api/v1/providers/patients (provider), admin uses POST /api/v1/patients and PUT /api/v1/patients/:id. */
@ApiTags('patients')
@ApiBearerAuth('access-token')
@Controller('patients')
@UseGuards(JwtAuthGuard)
export class PatientsController {
  constructor(private readonly patientsService: PatientsService) {}

  @Post()
  @ApiOperation({ summary: 'Create patient (admin only)' })
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

  @Get()
  @ApiOperation({ summary: 'List patients (access by role)' })
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
  @ApiOperation({ summary: 'Get patient by user ID (admin only)' })
  async getPatientByUserId(@Param('userId') userId: string, @CurrentUser('role') requestingUserRole: string) {
    return this.patientsService.getPatientByUserId(userId, requestingUserRole);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get patient by ID' })
  async getPatient(
    @Param('id') patientId: string,
    @CurrentUser('id') requestingUserId: string,
    @CurrentUser('role') requestingUserRole: string,
  ) {
    return this.patientsService.getPatient(patientId, requestingUserId, requestingUserRole);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update patient' })
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
