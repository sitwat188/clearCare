import { IsString, IsNotEmpty, IsEnum, IsOptional, IsDateString, IsBoolean, IsObject } from 'class-validator';

export enum InstructionType {
  MEDICATION = 'medication',
  LIFESTYLE = 'lifestyle',
  FOLLOW_UP = 'follow-up',
  WARNING = 'warning',
}

export enum InstructionPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}

export class CreateInstructionDto {
  @IsNotEmpty({ message: 'Patient ID is required' })
  @IsString({ message: 'Patient ID must be a string' })
  patientId: string;

  @IsNotEmpty({ message: 'Title is required' })
  @IsString({ message: 'Title must be a string' })
  title: string;

  @IsNotEmpty({ message: 'Type is required' })
  @IsEnum(InstructionType, { message: 'Type must be a valid instruction type' })
  type: InstructionType;

  @IsOptional()
  @IsEnum(InstructionPriority, {
    message: 'Priority must be a valid priority level',
  })
  priority?: InstructionPriority;

  @IsNotEmpty({ message: 'Content is required' })
  @IsString({ message: 'Content must be a string' })
  content: string;

  @IsOptional()
  @IsObject({ message: 'Medication details must be an object' })
  medicationDetails?: any;

  @IsOptional()
  @IsObject({ message: 'Lifestyle details must be an object' })
  lifestyleDetails?: any;

  @IsOptional()
  @IsObject({ message: 'Follow-up details must be an object' })
  followUpDetails?: any;

  @IsOptional()
  @IsObject({ message: 'Warning details must be an object' })
  warningDetails?: any;

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
  @IsBoolean({ message: 'Compliance tracking enabled must be a boolean' })
  complianceTrackingEnabled?: boolean;

  @IsOptional()
  @IsBoolean({ message: 'Lifestyle tracking enabled must be a boolean' })
  lifestyleTrackingEnabled?: boolean;
}
