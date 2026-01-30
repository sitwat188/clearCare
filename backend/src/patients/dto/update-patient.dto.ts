import {
  IsDateString,
  IsOptional,
  IsEnum,
  IsString,
  IsArray,
} from 'class-validator';
import { Gender } from './create-patient.dto';

export class UpdatePatientDto {
  @IsOptional()
  @IsDateString({}, { message: 'Date of birth must be a valid date' })
  dateOfBirth?: string;

  @IsOptional()
  @IsEnum(Gender, { message: 'Gender must be a valid value' })
  gender?: Gender;

  @IsOptional()
  @IsString({ message: 'Medical record number must be a string' })
  medicalRecordNumber?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  addressStreet?: string;

  @IsOptional()
  @IsString()
  addressCity?: string;

  @IsOptional()
  @IsString()
  addressState?: string;

  @IsOptional()
  @IsString()
  addressZipCode?: string;

  @IsOptional()
  @IsString({ message: 'Emergency contact must be a string' })
  emergencyContact?: string;

  @IsOptional()
  @IsString()
  emergencyContactName?: string;

  @IsOptional()
  @IsString()
  emergencyContactRelationship?: string;

  @IsOptional()
  @IsString()
  emergencyContactPhone?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  assignedProviderIds?: string[];
}
