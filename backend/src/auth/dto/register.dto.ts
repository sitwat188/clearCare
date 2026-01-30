import { IsEmail, IsString, MinLength, IsIn } from 'class-validator';

export class RegisterDto {
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email: string;

  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  password: string;

  @IsString()
  firstName: string;

  @IsString()
  lastName: string;

  @IsString()
  @IsIn(['patient', 'provider', 'administrator'], {
    message: 'Role must be one of: patient, provider, administrator',
  })
  role: 'patient' | 'provider' | 'administrator';
}
