import { IsString, MinLength } from 'class-validator';

export class ChangePasswordDto {
  /** Current account password */
  @IsString()
  @MinLength(1, { message: 'Current password is required' })
  currentPassword: string;

  /** New password (min 8 characters) */
  @IsString()
  @MinLength(8, { message: 'New password must be at least 8 characters long' })
  newPassword: string;
}
