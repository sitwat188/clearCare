import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class DisableTwoFactorDto {
  @ApiProperty({ description: 'Current password (required to disable 2FA)' })
  @IsString()
  @MinLength(1, { message: 'Password is required to disable 2FA' })
  password: string;
}
