import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import type { Request } from 'express';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { InstructionsService } from './instructions.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CreateInstructionDto } from './dto/create-instruction.dto';
import { UpdateInstructionDto } from './dto/update-instruction.dto';
import { AcknowledgeInstructionDto } from './dto/acknowledge-instruction.dto';

/** @deprecated Prefer role-prefixed routes: GET/POST /api/v1/providers/instructions (provider), GET/POST /api/v1/patients/me/instructions (patient). */
@ApiTags('instructions')
@ApiBearerAuth('access-token')
@Controller('instructions')
@UseGuards(JwtAuthGuard)
export class InstructionsController {
  constructor(private readonly instructionsService: InstructionsService) {}

  @Post()
  @ApiOperation({ summary: 'Create care instruction (provider)' })
  async createInstruction(
    @Body() createDto: CreateInstructionDto,
    @CurrentUser('id') requestingUserId: string,
    @CurrentUser('role') requestingUserRole: string,
    @Req() req: Request,
  ) {
    const ipAddress = req.ip ?? req.socket?.remoteAddress ?? undefined;
    const userAgent = typeof req.headers['user-agent'] === 'string' ? req.headers['user-agent'] : undefined;
    return this.instructionsService.createInstruction(
      createDto,
      requestingUserId,
      requestingUserRole,
      ipAddress,
      userAgent,
    );
  }

  @Get()
  @ApiOperation({ summary: 'List instructions (access by role)' })
  async getInstructions(
    @CurrentUser('id') requestingUserId: string,
    @CurrentUser('role') requestingUserRole: string,
    @Query('patientId') patientId?: string,
    @Query('status') status?: string,
    @Query('type') type?: string,
  ) {
    return this.instructionsService.getInstructions(requestingUserId, requestingUserRole, {
      patientId,
      status,
      type,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get instruction by ID' })
  async getInstruction(
    @Param('id') instructionId: string,
    @CurrentUser('id') requestingUserId: string,
    @CurrentUser('role') requestingUserRole: string,
  ) {
    return this.instructionsService.getInstruction(instructionId, requestingUserId, requestingUserRole);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update instruction (provider)' })
  async updateInstruction(
    @Param('id') instructionId: string,
    @Body() updateDto: UpdateInstructionDto,
    @CurrentUser('id') requestingUserId: string,
    @CurrentUser('role') requestingUserRole: string,
    @Req() req: Request,
  ) {
    const ipAddress = req.ip ?? req.socket?.remoteAddress ?? undefined;
    const userAgent = typeof req.headers['user-agent'] === 'string' ? req.headers['user-agent'] : undefined;
    return this.instructionsService.updateInstruction(
      instructionId,
      updateDto,
      requestingUserId,
      requestingUserRole,
      ipAddress,
      userAgent,
    );
  }

  /**
   * Delete instruction (soft delete)
   * DELETE /api/v1/instructions/:id
   * HIPAA: Provider only
   */
  @Delete(':id')
  async deleteInstruction(
    @Param('id') instructionId: string,
    @CurrentUser('id') requestingUserId: string,
    @CurrentUser('role') requestingUserRole: string,
    @Req() req: Request,
  ) {
    const ipAddress = req.ip ?? req.socket?.remoteAddress ?? undefined;
    const userAgent = typeof req.headers['user-agent'] === 'string' ? req.headers['user-agent'] : undefined;
    return this.instructionsService.deleteInstruction(
      instructionId,
      requestingUserId,
      requestingUserRole,
      ipAddress,
      userAgent,
    );
  }

  /**
   * Acknowledge instruction
   * POST /api/v1/instructions/:id/acknowledge
   * HIPAA: Patient only
   */
  @Post(':id/acknowledge')
  async acknowledgeInstruction(
    @Param('id') instructionId: string,
    @Body() acknowledgeDto: AcknowledgeInstructionDto,
    @CurrentUser('id') requestingUserId: string,
    @CurrentUser('role') requestingUserRole: string,
    @Req() req: Request,
  ) {
    const ipAddress = req.ip ?? req.socket?.remoteAddress ?? undefined;
    const userAgent = typeof req.headers['user-agent'] === 'string' ? req.headers['user-agent'] : undefined;
    return this.instructionsService.acknowledgeInstruction(
      instructionId,
      acknowledgeDto,
      requestingUserId,
      requestingUserRole,
      ipAddress,
      userAgent,
    );
  }
}
