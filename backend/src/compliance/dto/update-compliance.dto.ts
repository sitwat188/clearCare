import { IsEnum, IsOptional, IsNumber, IsObject } from 'class-validator';
import { ComplianceStatus } from './create-compliance.dto';

export class UpdateComplianceDto {
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
  medicationCompliance?: object;

  @IsOptional()
  @IsObject({ message: 'Lifestyle compliance data must be an object' })
  lifestyleCompliance?: object;

  @IsOptional()
  @IsObject({ message: 'Appointment compliance data must be an object' })
  appointmentCompliance?: object;
}
