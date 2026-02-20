import { IsString, IsNotEmpty, IsDateString, IsBoolean, IsOptional, IsNumber, IsObject } from 'class-validator';

export class UpdateLifestyleComplianceDto {
  @IsNotEmpty({ message: 'Date is required' })
  @IsDateString({}, { message: 'Date must be a valid date' })
  date: string;

  @IsOptional()
  @IsBoolean({ message: 'Completed must be a boolean' })
  completed?: boolean;

  @IsOptional()
  @IsString({ message: 'Notes must be a string' })
  notes?: string;

  @IsOptional()
  @IsNumber({}, { message: 'Progress must be a number' })
  progress?: number;

  @IsOptional()
  @IsObject({ message: 'Metrics must be an object' })
  metrics?: any;
}
