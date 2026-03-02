import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsDateString, IsBoolean, IsOptional, IsNumber, IsObject } from 'class-validator';

export class UpdateLifestyleComplianceDto {
  @ApiProperty({ description: 'Date (ISO 8601)' })
  @IsNotEmpty({ message: 'Date is required' })
  @IsDateString({}, { message: 'Date must be a valid date' })
  date: string;

  @ApiPropertyOptional({ description: 'Whether the activity was completed' })
  @IsOptional()
  @IsBoolean({ message: 'Completed must be a boolean' })
  completed?: boolean;

  @ApiPropertyOptional({ description: 'Notes' })
  @IsOptional()
  @IsString({ message: 'Notes must be a string' })
  notes?: string;

  @ApiPropertyOptional({ description: 'Progress (0–100)' })
  @IsOptional()
  @IsNumber({}, { message: 'Progress must be a number' })
  progress?: number;

  @ApiPropertyOptional({ description: 'Custom metrics object' })
  @IsOptional()
  @IsObject({ message: 'Metrics must be an object' })
  metrics?: any;
}
