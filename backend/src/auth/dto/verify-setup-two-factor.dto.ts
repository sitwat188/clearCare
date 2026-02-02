import { IsString, Length, Matches } from 'class-validator';

export class VerifySetupTwoFactorDto {
  /** Short-lived setup token returned from POST /auth/2fa/setup */
  @IsString()
  setupToken: string;

  /** 6-digit TOTP code from authenticator app (to confirm setup) */
  @IsString()
  @Length(6, 6, { message: 'Code must be 6 digits' })
  @Matches(/^\d{6}$/, { message: 'Code must be 6 digits' })
  code: string;
}
