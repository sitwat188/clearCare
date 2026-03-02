import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsEnum, IsOptional, IsNumber, IsObject } from 'class-validator';

export enum ComplianceType {
  MEDICATION = 'medication',
  LIFESTYLE = 'lifestyle',
  APPOINTMENT = 'appointment',
}

export enum ComplianceStatus {
  COMPLIANT = 'compliant',
  NON_COMPLIANT = 'non-compliant',
  PARTIAL = 'partial',
  NOT_STARTED = 'not-started',
}

export class CreateComplianceDto {
  @ApiProperty({ description: 'Instruction ID' })
  @IsNotEmpty({ message: 'Instruction ID is required' })
  @IsString({ message: 'Instruction ID must be a string' })
  instructionId: string;

  @ApiProperty({ enum: ComplianceType, description: 'Compliance type' })
  @IsNotEmpty({ message: 'Type is required' })
  @IsEnum(ComplianceType, {
    message: 'Type must be medication, lifestyle, or appointment',
  })
  type: ComplianceType;

  @ApiPropertyOptional({ enum: ComplianceStatus })
  @IsOptional()
  @IsEnum(ComplianceStatus, {
    message: 'Status must be a valid compliance status',
  })
  status?: ComplianceStatus;

  @ApiPropertyOptional({ description: 'Overall percentage (0-100)' })
  @IsOptional()
  @IsNumber({}, { message: 'Overall percentage must be a number' })
  overallPercentage?: number;

  @ApiPropertyOptional({ description: 'Medication compliance data' })
  @IsOptional()
  @IsObject({ message: 'Medication compliance data must be an object' })
  medicationCompliance?: any;

  @ApiPropertyOptional({ description: 'Lifestyle compliance data' })
  @IsOptional()
  @IsObject({ message: 'Lifestyle compliance data must be an object' })
  lifestyleCompliance?: any;

  @ApiPropertyOptional({ description: 'Appointment compliance data' })
  @IsOptional()
  @IsObject({ message: 'Appointment compliance data must be an object' })
  appointmentCompliance?: any;
}
