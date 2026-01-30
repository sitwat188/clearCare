import {
  IsEmail,
  IsString,
  IsIn,
  IsOptional,
  MinLength,
} from 'class-validator';

export class UpdateUserDto {
  @IsOptional()
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email?: string;

  @IsOptional()
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  password?: string;

  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsOptional()
  @IsString()
  @IsIn(['patient', 'provider', 'administrator'], {
    message: 'Role must be one of: patient, provider, administrator',
  })
  role?: 'patient' | 'provider' | 'administrator';
}
