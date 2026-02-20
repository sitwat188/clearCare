import { IsString, Length } from 'class-validator';

export class VerifyTwoFactorDto {
  /** Short-lived token returned from login when user has 2FA enabled */
  @IsString()
  twoFactorToken: string;

  /** 6-digit TOTP code from authenticator app, or a backup code (8 chars) */
  @IsString()
  @Length(6, 10, {
    message: 'Code must be 6 digits (authenticator) or 8 characters (backup code)',
  })
  code: string;
}
