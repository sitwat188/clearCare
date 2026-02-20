import { IsString, IsOptional, IsEnum, IsDateString, IsBoolean, IsObject } from 'class-validator';
import { InstructionType, InstructionPriority } from './create-instruction.dto';

export class UpdateInstructionDto {
  @IsOptional()
  @IsString({ message: 'Title must be a string' })
  title?: string;

  @IsOptional()
  @IsEnum(InstructionType, { message: 'Type must be a valid instruction type' })
  type?: InstructionType;

  @IsOptional()
  @IsEnum(InstructionPriority, {
    message: 'Priority must be a valid priority level',
  })
  priority?: InstructionPriority;

  @IsOptional()
  @IsString({ message: 'Content must be a string' })
  content?: string;

  @IsOptional()
  @IsObject({ message: 'Medication details must be an object' })
  medicationDetails?: object;

  @IsOptional()
  @IsObject({ message: 'Lifestyle details must be an object' })
  lifestyleDetails?: object;

  @IsOptional()
  @IsObject({ message: 'Follow-up details must be an object' })
  followUpDetails?: object;

  @IsOptional()
  @IsObject({ message: 'Warning details must be an object' })
  warningDetails?: object;

  @IsOptional()
  @IsDateString({}, { message: 'Assigned date must be a valid date' })
  assignedDate?: string;

  @IsOptional()
  @IsDateString({}, { message: 'Acknowledgment deadline must be a valid date' })
  acknowledgmentDeadline?: string;

  @IsOptional()
  @IsDateString({}, { message: 'Expiration date must be a valid date' })
  expirationDate?: string;

  @IsOptional()
  @IsString({ message: 'Status must be a string' })
  status?: string;

  @IsOptional()
  @IsBoolean({ message: 'Compliance tracking enabled must be a boolean' })
  complianceTrackingEnabled?: boolean;

  @IsOptional()
  @IsBoolean({ message: 'Lifestyle tracking enabled must be a boolean' })
  lifestyleTrackingEnabled?: boolean;
}
