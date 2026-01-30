import {
  IsEmail,
  IsString,
  MinLength,
  IsIn,
  IsOptional,
  IsArray,
  IsDateString,
} from 'class-validator';

export class CreateUserDto {
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email: string;

  @IsOptional()
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  password?: string;

  @IsString()
  firstName: string;

  @IsString()
  lastName: string;

  @IsString()
  @IsIn(['patient', 'provider', 'administrator'], {
    message: 'Role must be one of: patient, provider, administrator',
  })
  role: 'patient' | 'provider' | 'administrator';

  @IsOptional()
  @IsArray()
  permissions?: string[];

  @IsOptional()
  @IsDateString()
  createdAt?: string;

  @IsOptional()
  @IsString()
  organizationId?: string;
}
