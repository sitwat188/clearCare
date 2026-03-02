import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsString, IsIn, IsOptional, MinLength } from 'class-validator';

export class UpdateUserDto {
  @ApiPropertyOptional({ example: 'user@example.com' })
  @IsOptional()
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email?: string;

  @ApiPropertyOptional({ minLength: 8 })
  @IsOptional()
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  password?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiPropertyOptional({ enum: ['patient', 'provider', 'administrator'] })
  @IsOptional()
  @IsString()
  @IsIn(['patient', 'provider', 'administrator'], {
    message: 'Role must be one of: patient, provider, administrator',
  })
  role?: 'patient' | 'provider' | 'administrator';
}
