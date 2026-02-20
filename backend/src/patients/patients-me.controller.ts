import { Controller, Get, Post, Put, Body, Param, UseGuards, Req } from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { InstructionsService } from '../instructions/instructions.service';
import { ComplianceService } from '../compliance/compliance.service';
import { UsersService } from '../users/users.service';
import { UpdateProfileDto } from '../users/dto/update-profile.dto';
import { AcknowledgeInstructionDto } from '../instructions/dto/acknowledge-instruction.dto';
import { UpdateComplianceDto } from '../compliance/dto/update-compliance.dto';

/**
 * Patient "me" API: routes the frontend calls for the logged-in patient.
 * GET/POST /api/v1/patients/me/instructions, /patients/me/compliance, /patients/me/profile
 */
@Controller('patients/me')
@UseGuards(JwtAuthGuard)
export class PatientsMeController {
  constructor(
    private readonly instructionsService: InstructionsService,
    private readonly complianceService: ComplianceService,
    private readonly usersService: UsersService,
  ) {}

  @Get('instructions')
  async getMyInstructions(@CurrentUser('id') userId: string, @CurrentUser('role') role: string) {
    return this.instructionsService.getInstructions(userId, role, {});
  }

  @Get('instructions/:id')
  async getMyInstruction(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: string,
  ): Promise<Record<string, unknown>> {
    return this.instructionsService.getInstruction(id, userId, role);
  }

  @Post('instructions/:id/acknowledge')
  async acknowledgeInstruction(
    @Param('id') id: string,
    @Body() body: AcknowledgeInstructionDto,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: string,
    @Req() req: Request,
  ): Promise<Record<string, unknown>> {
    const ipAddress = req.ip ?? req.socket?.remoteAddress ?? undefined;
    const userAgent = typeof req.headers['user-agent'] === 'string' ? req.headers['user-agent'] : undefined;
    return this.instructionsService.acknowledgeInstruction(id, body, userId, role, ipAddress, userAgent);
  }

  @Get('compliance')
  async getMyCompliance(@CurrentUser('id') userId: string, @CurrentUser('role') role: string) {
    return this.complianceService.getComplianceRecords(userId, role, {});
  }

  @Get('compliance/metrics')
  async getMyComplianceMetrics(@CurrentUser('id') userId: string, @CurrentUser('role') role: string) {
    return this.complianceService.getComplianceMetrics(userId, role, {});
  }

  @Put('compliance/:recordId')
  async updateMyCompliance(
    @Param('recordId') recordId: string,
    @Body() body: UpdateComplianceDto,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: string,
  ) {
    return this.complianceService.updateComplianceRecord(recordId, body, userId, role);
  }

  @Get('profile')
  async getMyProfile(@CurrentUser('id') userId: string, @CurrentUser('role') role: string) {
    return this.usersService.getProfile(userId, userId, role);
  }

  @Put('profile')
  async updateMyProfile(
    @Body() body: UpdateProfileDto,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: string,
    @Req() req: Request,
  ) {
    const ipAddress = req.ip ?? req.socket?.remoteAddress ?? undefined;
    const userAgent = typeof req.headers['user-agent'] === 'string' ? req.headers['user-agent'] : undefined;
    return this.usersService.updateProfile(userId, body, userId, role, ipAddress, userAgent);
  }
}
