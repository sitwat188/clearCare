import { IsString, MinLength } from 'class-validator';

export class DisableTwoFactorDto {
  /** Current account password (required to disable 2FA) */
  @IsString()
  @MinLength(1, { message: 'Password is required to disable 2FA' })
  password: string;
}
