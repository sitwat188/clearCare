import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsDateString, IsEnum, IsOptional, IsNumber } from 'class-validator';

export enum DoseStatus {
  TAKEN = 'taken',
  MISSED = 'missed',
  PENDING = 'pending',
}

export class UpdateMedicationAdherenceDto {
  @ApiProperty({ description: 'Date (ISO 8601)' })
  @IsNotEmpty({ message: 'Date is required' })
  @IsDateString({}, { message: 'Date must be a valid date' })
  date: string;

  @ApiPropertyOptional({ description: 'Time' })
  @IsOptional()
  @IsString({ message: 'Time must be a string' })
  time?: string;

  @ApiPropertyOptional({ enum: DoseStatus })
  @IsOptional()
  @IsEnum(DoseStatus, { message: 'Status must be taken, missed, or pending' })
  status?: DoseStatus;

  @ApiPropertyOptional({ description: 'Reason (e.g. for missed)' })
  @IsOptional()
  @IsString({ message: 'Reason must be a string' })
  reason?: string;

  @ApiPropertyOptional({ description: 'Progress (0-100)' })
  @IsOptional()
  @IsNumber({}, { message: 'Progress must be a number' })
  progress?: number;
}
