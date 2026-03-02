import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';

export class VerifyTwoFactorDto {
  @ApiProperty({ description: 'Short-lived token from login when 2FA is enabled' })
  @IsString()
  twoFactorToken: string;

  @ApiProperty({ example: '123456', description: '6-digit TOTP or 8-char backup code' })
  @IsString()
  @Length(6, 10, {
    message: 'Code must be 6 digits (authenticator) or 8 characters (backup code)',
  })
  code: string;
}
