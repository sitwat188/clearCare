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
  @IsNotEmpty({ message: 'Instruction ID is required' })
  @IsString({ message: 'Instruction ID must be a string' })
  instructionId: string;

  @IsNotEmpty({ message: 'Type is required' })
  @IsEnum(ComplianceType, {
    message: 'Type must be medication, lifestyle, or appointment',
  })
  type: ComplianceType;

  @IsOptional()
  @IsEnum(ComplianceStatus, {
    message: 'Status must be a valid compliance status',
  })
  status?: ComplianceStatus;

  @IsOptional()
  @IsNumber({}, { message: 'Overall percentage must be a number' })
  overallPercentage?: number;

  @IsOptional()
  @IsObject({ message: 'Medication compliance data must be an object' })
  medicationCompliance?: any;

  @IsOptional()
  @IsObject({ message: 'Lifestyle compliance data must be an object' })
  lifestyleCompliance?: any;

  @IsOptional()
  @IsObject({ message: 'Appointment compliance data must be an object' })
  appointmentCompliance?: any;
}
