import { IsString, IsNotEmpty, IsDateString, IsEnum, IsOptional, IsNumber } from 'class-validator';

export enum DoseStatus {
  TAKEN = 'taken',
  MISSED = 'missed',
  PENDING = 'pending',
}

export class UpdateMedicationAdherenceDto {
  @IsNotEmpty({ message: 'Date is required' })
  @IsDateString({}, { message: 'Date must be a valid date' })
  date: string;

  @IsOptional()
  @IsString({ message: 'Time must be a string' })
  time?: string;

  @IsOptional()
  @IsEnum(DoseStatus, { message: 'Status must be taken, missed, or pending' })
  status?: DoseStatus;

  @IsOptional()
  @IsString({ message: 'Reason must be a string' })
  reason?: string;

  @IsOptional()
  @IsNumber({}, { message: 'Progress must be a number' })
  progress?: number;
}
