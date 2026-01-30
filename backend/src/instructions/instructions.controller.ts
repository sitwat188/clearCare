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
import { InstructionsService } from './instructions.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CreateInstructionDto } from './dto/create-instruction.dto';
import { UpdateInstructionDto } from './dto/update-instruction.dto';
import { AcknowledgeInstructionDto } from './dto/acknowledge-instruction.dto';

@Controller('instructions')
@UseGuards(JwtAuthGuard) // All routes require authentication
export class InstructionsController {
  constructor(private readonly instructionsService: InstructionsService) {}

  /**
   * Create a new care instruction
   * POST /api/v1/instructions
   * HIPAA: Provider only
   */
  @Post()
  async createInstruction(
    @Body() createDto: CreateInstructionDto,
    @CurrentUser('id') requestingUserId: string,
    @CurrentUser('role') requestingUserRole: string,
    @Req() req: any,
  ) {
    const ipAddress = req.ip || req.connection?.remoteAddress;
    const userAgent = req.headers['user-agent'];
    return this.instructionsService.createInstruction(
      createDto,
      requestingUserId,
      requestingUserRole,
      ipAddress,
      userAgent,
    );
  }

  /**
   * Get all instructions (with access control)
   * GET /api/v1/instructions
   */
  @Get()
  async getInstructions(
    @CurrentUser('id') requestingUserId: string,
    @CurrentUser('role') requestingUserRole: string,
    @Query('patientId') patientId?: string,
    @Query('status') status?: string,
    @Query('type') type?: string,
  ) {
    return this.instructionsService.getInstructions(
      requestingUserId,
      requestingUserRole,
      {
        patientId,
        status,
        type,
      },
    );
  }

  /**
   * Get instruction by ID
   * GET /api/v1/instructions/:id
   */
  @Get(':id')
  async getInstruction(
    @Param('id') instructionId: string,
    @CurrentUser('id') requestingUserId: string,
    @CurrentUser('role') requestingUserRole: string,
  ) {
    return this.instructionsService.getInstruction(
      instructionId,
      requestingUserId,
      requestingUserRole,
    );
  }

  /**
   * Update instruction
   * PUT /api/v1/instructions/:id
   * HIPAA: Provider only
   */
  @Put(':id')
  async updateInstruction(
    @Param('id') instructionId: string,
    @Body() updateDto: UpdateInstructionDto,
    @CurrentUser('id') requestingUserId: string,
    @CurrentUser('role') requestingUserRole: string,
    @Req() req: any,
  ) {
    const ipAddress = req.ip || req.connection?.remoteAddress;
    const userAgent = req.headers['user-agent'];
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
    @Req() req: any,
  ) {
    const ipAddress = req.ip || req.connection?.remoteAddress;
    const userAgent = req.headers['user-agent'];
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
    @Req() req: any,
  ) {
    const ipAddress = req.ip || req.connection?.remoteAddress;
    const userAgent = req.headers['user-agent'];
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
