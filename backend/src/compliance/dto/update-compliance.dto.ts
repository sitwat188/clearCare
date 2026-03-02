import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsNumber, IsObject } from 'class-validator';
import { ComplianceStatus } from './create-compliance.dto';

export class UpdateComplianceDto {
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
  medicationCompliance?: object;

  @ApiPropertyOptional({ description: 'Lifestyle compliance data' })
  @IsOptional()
  @IsObject({ message: 'Lifestyle compliance data must be an object' })
  lifestyleCompliance?: object;

  @ApiPropertyOptional({ description: 'Appointment compliance data' })
  @IsOptional()
  @IsObject({ message: 'Appointment compliance data must be an object' })
  appointmentCompliance?: object;
}
