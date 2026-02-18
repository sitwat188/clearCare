import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import * as nodemailer from 'nodemailer';
import { Resend } from 'resend';
import * as speakeasy from 'speakeasy';
import * as QRCode from 'qrcode';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { JwtPayload } from './strategies/jwt.strategy';
import {
  getPasswordResetEmailHtml,
  getRestoreNotificationEmailHtml,
  getInvitationEmailHtml,
} from '../email-templates';
import { EncryptionService } from '../common/encryption/encryption.service';
import { redactPHIFromObject, redactPHIFromString } from '../common/redact-phi';

const TWO_FACTOR_APP_NAME = 'ClearCare';
const BACKUP_CODES_COUNT = 8;
const BACKUP_CODE_LENGTH = 8;

const RESET_TOKEN_EXPIRY_HOURS = 1;
const SALT_ROUNDS = 12;

// Role permissions mapping (HIPAA: strict RBAC)
const ROLE_PERMISSIONS: Record<string, string[]> = {
  patient: [
    'read:own-instructions',
    'write:own-acknowledgment',
    'read:own-compliance',
    'read:own-profile',
    'write:own-profile',
  ],
  provider: [
    'read:patients',
    'read:instructions',
    'write:instructions',
    'read:compliance',
    'read:reports',
    'write:templates',
  ],
  administrator: [
    'admin:users',
    'admin:roles',
    'admin:system',
    'admin:audit',
    'admin:reports',
  ],
};

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private usersService: UsersService,
    private encryption: EncryptionService,
  ) {}

  /** Decrypt email, firstName, lastName for API response / tokens (supports legacy plaintext rows). */
  private decryptUser<
    T extends { email: string; firstName: string; lastName: string },
  >(user: T): T & { email: string; firstName: string; lastName: string } {
    return {
      ...user,
      email: this.encryption.decrypt(user.email),
      firstName: this.encryption.decrypt(user.firstName),
      lastName: this.encryption.decrypt(user.lastName),
    };
  }

  async register(
    registerDto: RegisterDto,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const normalizedEmail = registerDto.email.toLowerCase().trim();
    const emailHash = this.encryption.hashEmailForLookup(normalizedEmail);
    const existingByHash = emailHash
      ? await this.prisma.user.findFirst({
          where: { emailHash, deletedAt: null },
        })
      : null;
    const existingUser =
      existingByHash ??
      (await this.prisma.user.findFirst({
        where: { email: normalizedEmail, deletedAt: null },
      }));

    if (existingUser) {
      if (existingUser.deletedAt) {
        throw new ConflictException(
          'This email is associated with an inactive account. Reuse is not allowed. Contact support to restore the account.',
        );
      }
      throw new ConflictException('A user with this email already exists');
    }

    // HIPAA: Prevent creating administrator users via registration
    if (registerDto.role === 'administrator') {
      throw new BadRequestException('Creating Administrator users is disabled');
    }

    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(registerDto.password, saltRounds);

    const user = await this.prisma.user.create({
      data: {
        emailHash,
        email: this.encryption.encrypt(normalizedEmail),
        passwordHash,
        firstName: this.encryption.encrypt(registerDto.firstName),
        lastName: this.encryption.encrypt(registerDto.lastName),
        role: registerDto.role,
      },
    });

    await this.prisma.userHistory.create({
      data: {
        userId: user.id,
        action: 'create',
        changedBy: user.id,
        newValues: redactPHIFromObject({
          email: this.encryption.encrypt(normalizedEmail),
          role: user.role,
          firstName: this.encryption.encrypt(registerDto.firstName),
          lastName: this.encryption.encrypt(registerDto.lastName),
        }),
        ipAddress,
        userAgent,
      },
    });

    const decrypted = this.decryptUser(user);
    const tokens = await this.generateTokens(
      user.id,
      decrypted.email,
      user.role,
    );

    return {
      user: {
        id: user.id,
        email: decrypted.email,
        firstName: decrypted.firstName,
        lastName: decrypted.lastName,
        role: user.role,
        permissions: ROLE_PERMISSIONS[user.role] || [],
        createdAt: user.createdAt,
      },
      ...tokens,
    };
  }

  async login(loginDto: LoginDto, ipAddress?: string, userAgent?: string) {
    const normalized = loginDto.email.toLowerCase().trim();
    const emailHash = this.encryption.hashEmailForLookup(normalized);
    let user = emailHash
      ? await this.prisma.user.findFirst({
          where: { emailHash, deletedAt: null },
        })
      : null;
    if (!user) {
      user = await this.prisma.user.findFirst({
        where: { email: normalized, deletedAt: null },
      });
      if (user && !user.emailHash) {
        await this.prisma.user.update({
          where: { id: user.id },
          data: {
            emailHash: this.encryption.hashEmailForLookup(
              this.encryption.decrypt(user.email) || user.email,
            ),
            email: this.encryption.encrypt(
              this.encryption.decrypt(user.email) || user.email,
            ),
            firstName: this.encryption.encrypt(
              this.encryption.decrypt(user.firstName) || user.firstName,
            ),
            lastName: this.encryption.encrypt(
              this.encryption.decrypt(user.lastName) || user.lastName,
            ),
          },
        });
        const updated = await this.prisma.user.findFirst({
          where: { id: user.id },
        });
        if (updated) user = updated;
      }
    }

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.passwordHash,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // If 2FA is enabled, return a short-lived token and require 2FA verification
    if (user.twoFactorEnabled) {
      const twoFactorToken = this.jwtService.sign(
        { sub: user.id, purpose: '2fa-login' },
        {
          secret:
            process.env.JWT_SECRET || 'your-secret-key-change-in-production',
          expiresIn: '5m',
        },
      );
      return {
        requiresTwoFactor: true,
        twoFactorToken,
        message: 'Enter your authenticator or backup code to complete login.',
      };
    }

    // Temporary password expired (invitation flow)
    if (user.mustChangePassword && user.temporaryPasswordExpiresAt) {
      if (new Date() > user.temporaryPasswordExpiresAt) {
        throw new UnauthorizedException(
          'Your temporary password has expired. Please request a new invitation or password reset from your administrator.',
        );
      }
    }

    // Update last login
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Create user history entry
    await this.prisma.userHistory.create({
      data: {
        userId: user.id,
        action: 'login',
        changedBy: user.id,
        ipAddress,
        userAgent,
      },
    });

    const decrypted = this.decryptUser(user);
    const tokens = await this.generateTokens(
      user.id,
      decrypted.email,
      user.role,
    );
    const mustChangePassword = !!(
      user.mustChangePassword &&
      user.temporaryPasswordExpiresAt &&
      new Date() <= user.temporaryPasswordExpiresAt
    );

    return {
      user: {
        id: user.id,
        email: decrypted.email,
        firstName: decrypted.firstName,
        lastName: decrypted.lastName,
        role: user.role,
        permissions: ROLE_PERMISSIONS[user.role] || [],
        lastLoginAt: user.lastLoginAt,
      },
      ...tokens,
      ...(mustChangePassword ? { mustChangePassword: true } : {}),
    };
  }

  /**
   * Complete login after 2FA: verify TOTP or backup code, then issue tokens.
   */
  async verifyTwoFactorLogin(
    twoFactorToken: string,
    code: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    let payload: { sub: string; purpose: string };
    try {
      payload = this.jwtService.verify<{ sub: string; purpose: string }>(
        twoFactorToken,
        {
          secret:
            process.env.JWT_SECRET || 'your-secret-key-change-in-production',
        },
      );
    } catch {
      throw new UnauthorizedException(
        'Invalid or expired 2FA session. Please log in again.',
      );
    }
    if (payload.purpose !== '2fa-login') {
      throw new UnauthorizedException('Invalid token.');
    }

    const userId = payload.sub;
    const user = await this.prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
    });
    if (!user) {
      throw new UnauthorizedException('User not found.');
    }

    const codeTrimmed = code.trim();
    const is6Digits = /^\d{6}$/.test(codeTrimmed);

    if (is6Digits) {
      // TOTP verification
      const secret = await this.usersService.getTwoFactorSecret(userId);
      if (!secret) {
        throw new BadRequestException('2FA is not properly configured.');
      }
      const valid = speakeasy.totp.verify({
        secret,
        encoding: 'base32',
        token: codeTrimmed,
        window: 1,
      });
      if (!valid) {
        throw new UnauthorizedException('Invalid authenticator code.');
      }
    } else {
      // Backup code verification
      const backupCodesJson = await this.usersService.getBackupCodes(userId);
      if (!backupCodesJson) {
        throw new UnauthorizedException('Invalid backup code.');
      }
      let codes: string[];
      try {
        codes = JSON.parse(backupCodesJson) as string[];
      } catch {
        throw new BadRequestException('Invalid backup codes data.');
      }
      const index = codes.findIndex(
        (c) => c.trim().toLowerCase() === codeTrimmed.toLowerCase(),
      );
      if (index === -1) {
        throw new UnauthorizedException('Invalid backup code.');
      }
      codes.splice(index, 1);
      await this.usersService.setBackupCodes(userId, JSON.stringify(codes));
    }

    // Update last login and create history
    await this.prisma.user.update({
      where: { id: userId },
      data: { lastLoginAt: new Date() },
    });
    await this.prisma.userHistory.create({
      data: {
        userId: user.id,
        action: 'login',
        changedBy: user.id,
        ipAddress,
        userAgent,
      },
    });

    const decrypted = this.decryptUser(user);
    const tokens = await this.generateTokens(
      user.id,
      decrypted.email,
      user.role,
    );
    const mustChangePassword = !!(
      user.mustChangePassword &&
      user.temporaryPasswordExpiresAt &&
      new Date() <= user.temporaryPasswordExpiresAt
    );
    return {
      user: {
        id: user.id,
        email: decrypted.email,
        firstName: decrypted.firstName,
        lastName: decrypted.lastName,
        role: user.role,
        permissions: ROLE_PERMISSIONS[user.role] || [],
        lastLoginAt: user.lastLoginAt,
      },
      ...tokens,
      ...(mustChangePassword ? { mustChangePassword: true } : {}),
    };
  }

  /**
   * Start 2FA setup: generate secret and QR code; return setupToken for verify-setup.
   */
  async setupTwoFactor(userId: string) {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
    });
    if (!user) {
      throw new NotFoundException('User not found.');
    }
    if (user.twoFactorEnabled) {
      throw new BadRequestException('2FA is already enabled.');
    }

    const secret = speakeasy.generateSecret({
      name: `${TWO_FACTOR_APP_NAME} (${this.encryption.decrypt(user.email)})`,
      length: 20,
    });
    if (!secret.base32) {
      throw new BadRequestException('Failed to generate 2FA secret.');
    }

    const otpauthUrl = secret.otpauth_url;
    if (!otpauthUrl) {
      throw new BadRequestException('Failed to generate OTP URL.');
    }

    let qrCodeDataUrl: string;
    try {
      qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl);
    } catch {
      throw new BadRequestException('Failed to generate QR code.');
    }

    const setupToken = this.jwtService.sign(
      { sub: userId, twoFactorSecret: secret.base32, purpose: '2fa-setup' },
      {
        secret:
          process.env.JWT_SECRET || 'your-secret-key-change-in-production',
        expiresIn: '10m',
      },
    );

    return {
      secret: secret.base32,
      qrCodeDataUrl,
      setupToken,
      message:
        'Scan the QR code with your authenticator app, then enter the 6-digit code to verify.',
    };
  }

  /**
   * Complete 2FA setup: verify code from authenticator, save secret and backup codes.
   */
  async verifySetupTwoFactor(setupToken: string, code: string, userId: string) {
    let payload: { sub: string; twoFactorSecret: string; purpose: string };
    try {
      payload = this.jwtService.verify<{
        sub: string;
        twoFactorSecret: string;
        purpose: string;
      }>(setupToken, {
        secret:
          process.env.JWT_SECRET || 'your-secret-key-change-in-production',
      });
    } catch {
      throw new UnauthorizedException(
        'Setup link expired. Please start 2FA setup again.',
      );
    }
    if (payload.purpose !== '2fa-setup' || payload.sub !== userId) {
      throw new UnauthorizedException('Invalid setup token.');
    }

    const valid = speakeasy.totp.verify({
      secret: payload.twoFactorSecret,
      encoding: 'base32',
      token: code.trim(),
      window: 1,
    });
    if (!valid) {
      throw new UnauthorizedException('Invalid code. Please try again.');
    }

    await this.usersService.setTwoFactorSecret(
      payload.sub,
      payload.twoFactorSecret,
    );

    const backupCodes = this.generateBackupCodes();
    await this.usersService.setBackupCodes(
      payload.sub,
      JSON.stringify(backupCodes),
    );

    return {
      backupCodes,
      message:
        '2FA has been enabled. Save your backup codes in a secure place.',
    };
  }

  /**
   * Disable 2FA after verifying current password.
   */
  async disableTwoFactor(userId: string, password: string) {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
    });
    if (!user) {
      throw new NotFoundException('User not found.');
    }
    if (!user.twoFactorEnabled) {
      throw new BadRequestException('2FA is not enabled.');
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid password.');
    }

    await this.usersService.clearTwoFactor(userId);
    return { message: '2FA has been disabled.' };
  }

  private generateBackupCodes(): string[] {
    const codes: string[] = [];
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    for (let i = 0; i < BACKUP_CODES_COUNT; i++) {
      let code = '';
      for (let j = 0; j < BACKUP_CODE_LENGTH; j++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      codes.push(code);
    }
    return codes;
  }

  async validateUser(userId: string) {
    const user = await this.prisma.user.findFirst({
      where: {
        id: userId,
        deletedAt: null,
      },
    });

    if (!user) {
      return null;
    }

    const decrypted = this.decryptUser(user);
    return {
      id: user.id,
      email: decrypted.email,
      firstName: decrypted.firstName,
      lastName: decrypted.lastName,
      role: user.role,
      permissions: ROLE_PERMISSIONS[user.role] || [],
      twoFactorEnabled: user.twoFactorEnabled,
    };
  }

  async refreshToken(refreshToken: string) {
    try {
      const payload = this.jwtService.verify<JwtPayload>(refreshToken, {
        secret:
          process.env.JWT_REFRESH_SECRET ||
          'your-refresh-secret-key-change-in-production',
      });

      const user = await this.prisma.user.findFirst({
        where: {
          id: payload.sub,
          deletedAt: null,
        },
      });

      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      const decrypted = this.decryptUser(user);
      return this.generateTokens(user.id, decrypted.email, user.role);
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const email = dto.email.toLowerCase().trim();
    const emailHash = this.encryption.hashEmailForLookup(email);
    let user = emailHash
      ? await this.prisma.user.findFirst({
          where: { emailHash, deletedAt: null },
        })
      : null;
    if (!user) {
      user = await this.prisma.user.findFirst({
        where: { email, deletedAt: null },
      });
    }

    if (!user) {
      throw new NotFoundException('No account found with this email address.');
    }

    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(
      Date.now() + RESET_TOKEN_EXPIRY_HOURS * 60 * 60 * 1000,
    );

    await this.prisma.passwordResetToken.create({
      data: { userId: user.id, token, expiresAt },
    });

    // In production, always send to the user's email. Redirect only for testing/staging (when NODE_ENV !== 'production').
    const redirect = process.env.PASSWORD_RESET_REDIRECT_EMAIL?.trim();
    const mailTo =
      process.env.NODE_ENV !== 'production' && redirect ? redirect : email;
    const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${token}`;

    // Send email in background so request returns immediately (avoids timeout when SMTP is blocked, e.g. on Render)
    void this.sendPasswordResetEmail(mailTo, resetLink, expiresAt, email).catch(
      () => {},
    );

    return {
      message: 'A password reset link has been sent. Please check your inbox.',
    };
  }

  private static isResendConfigured(): boolean {
    return !!process.env.RESEND_API_KEY?.trim();
  }

  private static getMailFrom(): string {
    const from = process.env.MAIL_FROM?.trim();
    if (from) return from;
    if (AuthService.isResendConfigured())
      return 'ClearCare <onboarding@resend.dev>';
    const user = process.env.SMTP_USER?.trim()?.replace(/^["']|["']$/g, '');
    return user ? `ClearCare <${user}>` : 'ClearCare <noreply@example.com>';
  }

  /**
   * When MAIL_OVERRIDE_TO is set, all transactional mail is sent to this address
   * instead of the intended recipient.
  private static getEffectiveMailTo(originalTo: string): string {
    const override = process.env.MAIL_OVERRIDE_TO?.trim();
    return override || originalTo;
  }

  /**
   * Send password reset email. Uses Resend (HTTP) if RESEND_API_KEY is set (works on Render);
   * otherwise uses SMTP. If neither is configured, logs the link to console.
   */
  private async sendPasswordResetEmail(
    to: string,
    resetLink: string,
    expiresAt: Date,
    requestedForEmail: string,
  ): Promise<void> {
    const effectiveTo = AuthService.getEffectiveMailTo(to);
    const isProduction = process.env.NODE_ENV === 'production';
    const resendKey = process.env.RESEND_API_KEY?.trim();
    const host = process.env.SMTP_HOST?.trim();
    const port = process.env.SMTP_PORT?.trim();
    const user = process.env.SMTP_USER?.trim();
    const pass = process.env.SMTP_PASS?.trim();

    if (resendKey) {
      const from = AuthService.getMailFrom();
      console.log(
        `[Password reset] Sending via Resend to ${redactPHIFromString(effectiveTo)} (from: ${from})`,
      );
      const resend = new Resend(resendKey);
      const html = getPasswordResetEmailHtml(requestedForEmail, resetLink);
      const { data, error } = await resend.emails.send({
        from,
        to: effectiveTo,
        subject: 'Reset your password - ClearCare+',
        html,
      });
      if (error) {
        console.error(
          '[Password reset] Resend failed:',
          error.message ?? JSON.stringify(error),
        );
        console.error(
          '[Password reset] Full Resend error:',
          JSON.stringify(error),
        );
        if (isProduction) {
          console.error(
            '[Password reset] Fix: Use MAIL_FROM=ClearCare <onboarding@resend.dev> (or verify your domain in Resend dashboard).',
          );
        }
        return;
      }
      console.log(
        `[Password reset] Sent via Resend to ${redactPHIFromString(effectiveTo)} (id: ${data?.id ?? 'n/a'})`,
      );
      return;
    }

    if (!host || !port || !user || !pass) {
      if (isProduction) {
        console.error(
          '[Password reset] PRODUCTION: No email sent. Set RESEND_API_KEY (recommended on Render) or SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS.',
        );
      } else {
        console.log(
          `[Password reset] Mail not configured. Would send to ${redactPHIFromString(effectiveTo)}. Reset link (1h): ${redactPHIFromString(resetLink)}`,
        );
      }
      return;
    }

    const cleanPass = pass.replace(/^["']|["']$/g, '');
    const cleanUser = user.replace(/^["']|["']$/g, '');
    if (!isProduction) {
      console.log(
        `[Password reset] Sending to ${redactPHIFromString(effectiveTo)} via ${host}:${port} (SMTP_USER=${redactPHIFromString(cleanUser)})`,
      );
    }
    try {
      const transporter = nodemailer.createTransport({
        host,
        port: parseInt(port, 10),
        secure: process.env.SMTP_SECURE?.trim() === 'true',
        auth: { user: cleanUser, pass: cleanPass },
      });
      const from = AuthService.getMailFrom();
      const html = getPasswordResetEmailHtml(requestedForEmail, resetLink);
      const text = `A password reset was requested for ${requestedForEmail}. Use this link to reset your password (expires ${expiresAt.toISOString()}): ${resetLink}`;
      await transporter.sendMail({
        from,
        to: effectiveTo,
        subject: 'Reset your password - ClearCare+',
        text,
        html,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      const response =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: string }).response
          : undefined;
      console.error('[Password reset] Failed to send email:', msg);
      if (response) console.error('[Password reset] SMTP response:', response);
      if (isProduction) {
        console.error(
          '[Password reset] PRODUCTION: On Render, SMTP is often blocked. Use RESEND_API_KEY instead (HTTP API).',
        );
      }
    }
  }

  /**
   * Send restore notification email. Uses Resend or SMTP like invitation/password reset.
   * Called by admin when a soft-deleted user is restored.
   */
  async sendRestoreNotificationEmail(
    to: string,
    firstName: string,
  ): Promise<void> {
    const loginUrl =
      process.env.FRONTEND_URL?.trim() || 'http://localhost:5173';
    const redirect = process.env.PASSWORD_RESET_REDIRECT_EMAIL?.trim();
    const mailTo =
      process.env.NODE_ENV !== 'production' && redirect ? redirect : to;
    const host = process.env.SMTP_HOST?.trim();
    const port = process.env.SMTP_PORT?.trim();
    const user = process.env.SMTP_USER?.trim();
    const pass = process.env.SMTP_PASS?.trim();

    const subject = 'Your ClearCare+ account was restored';
    const displayName = firstName?.trim() || 'User';
    const html = getRestoreNotificationEmailHtml(displayName, loginUrl);
    const text = `Hi ${displayName}, an administrator has restored your ClearCare+ account. You can log in at ${loginUrl}/login. If you don't remember your password, use "Forgot password" on the sign-in page.`;

    if (!mailTo) {
      console.log(`[Restore notification] No recipient. Would send to ${to}.`);
      return;
    }
    const effectiveTo = AuthService.getEffectiveMailTo(mailTo);
    const isProduction = process.env.NODE_ENV === 'production';
    const resendKey = process.env.RESEND_API_KEY?.trim();

    if (resendKey) {
      const from = AuthService.getMailFrom();
      console.log(
        `[Restore notification] Sending via Resend to ${redactPHIFromString(effectiveTo)} (from: ${from})`,
      );
      const resend = new Resend(resendKey);
      const { data, error } = await resend.emails.send({
        from,
        to: effectiveTo,
        subject,
        html,
      });
      if (error) {
        console.error(
          '[Restore notification] Resend failed:',
          error.message ?? JSON.stringify(error),
        );
        if (isProduction) {
          console.error(
            '[Restore notification] Fix: Use MAIL_FROM=ClearCare <onboarding@resend.dev> or verify your domain in Resend.',
          );
        }
        return;
      }
      console.log(
        `[Restore notification] Sent via Resend to ${redactPHIFromString(effectiveTo)} (id: ${data?.id ?? 'n/a'})`,
      );
      return;
    }

    if (!host || !port || !user || !pass) {
      if (isProduction) {
        console.error(
          '[Restore notification] PRODUCTION: No email sent. Set RESEND_API_KEY or SMTP_*.',
        );
      } else {
        console.log(
          `[Restore notification] Mail not configured. Would send to ${redactPHIFromString(effectiveTo)}: account restored for ${redactPHIFromString(to)}.`,
        );
      }
      return;
    }
    const cleanPass = pass.replace(/^["']|["']$/g, '');
    const cleanUser = user.replace(/^["']|["']$/g, '');
    try {
      const transporter = nodemailer.createTransport({
        host,
        port: parseInt(port, 10),
        secure: process.env.SMTP_SECURE?.trim() === 'true',
        auth: { user: cleanUser, pass: cleanPass },
      });
      const from = AuthService.getMailFrom();
      await transporter.sendMail({
        from,
        to: effectiveTo,
        subject,
        text,
        html,
      });
    } catch (err) {
      console.error('[Restore notification] Failed to send to', effectiveTo, err);
      if (isProduction) {
        console.error(
          '[Restore notification] PRODUCTION: On Render, use RESEND_API_KEY instead.',
        );
      }
    }
  }

  /**
   * Send invitation email with temporary password. In production, sends to the invited user's email.
   * When NODE_ENV !== 'production' and PASSWORD_RESET_REDIRECT_EMAIL is set, redirects to that address for testing.
   */
  async sendInvitationEmail(
    invitedUserEmail: string,
    firstName: string,
    temporaryPassword: string,
  ): Promise<void> {
    const loginUrl =
      process.env.FRONTEND_URL?.trim() || 'http://localhost:5173';
    const redirect = process.env.PASSWORD_RESET_REDIRECT_EMAIL?.trim();
    const mailTo =
      process.env.NODE_ENV !== 'production' && redirect
        ? redirect
        : invitedUserEmail;
    const host = process.env.SMTP_HOST?.trim();
    const port = process.env.SMTP_PORT?.trim();
    const user = process.env.SMTP_USER?.trim();
    const pass = process.env.SMTP_PASS?.trim();

    const subject = "You're invited to ClearCare+";
    const displayName = firstName || 'User';
    const text = `Welcome to ClearCare+, ${displayName}.\n\nYour account has been created. Use the temporary password below to log in. You will be asked to set a new password on first login. This temporary password is valid for one day.\n\nEmail: ${invitedUserEmail}\nTemporary password: ${temporaryPassword}\n\nLog in here: ${loginUrl}/login\n\nIf you did not expect this email, please contact your administrator.`;
    const html = getInvitationEmailHtml(
      displayName,
      invitedUserEmail,
      temporaryPassword,
      loginUrl,
    );

    if (!mailTo) {
      const invitee = redactPHIFromString(invitedUserEmail);
      const tempPw = redactPHIFromString(temporaryPassword);
      console.log(
        `[Invitation] No recipient. Invited: ${invitee}, temp pw (valid 1 day): ${tempPw}`,
      );
      return;
    }
    const effectiveTo = AuthService.getEffectiveMailTo(mailTo);
    const isProduction = process.env.NODE_ENV === 'production';
    const resendKey = process.env.RESEND_API_KEY?.trim();

    if (resendKey) {
      const from = AuthService.getMailFrom();
      console.log(
        `[Invitation] Sending via Resend to ${redactPHIFromString(effectiveTo)} (from: ${redactPHIFromString(from)})`,
      );
      const resend = new Resend(resendKey);
      const { data, error } = await resend.emails.send({
        from,
        to: effectiveTo,
        subject,
        html,
      });
      if (error) {
        console.error(
          '[Invitation] Resend failed:',
          error.message ?? JSON.stringify(error),
        );
        console.error('[Invitation] Full Resend error:', JSON.stringify(error));
        if (isProduction) {
          console.error(
            '[Invitation] Fix: Use MAIL_FROM=ClearCare <onboarding@resend.dev> (or verify your domain in Resend dashboard).',
          );
        }
        return;
      }
      console.log(
        `[Invitation] Sent via Resend to ${redactPHIFromString(effectiveTo)} (id: ${data?.id ?? 'n/a'})`,
      );
      return;
    }

    if (!host || !port || !user || !pass) {
      if (isProduction) {
        console.error(
          '[Invitation] PRODUCTION: No email sent. Set RESEND_API_KEY (recommended on Render) or SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS.',
        );
      } else {
        const toAddr = redactPHIFromString(effectiveTo);
        const invitee = redactPHIFromString(invitedUserEmail);
        const tempPw = redactPHIFromString(temporaryPassword);
        console.log(
          `[Invitation] Mail not configured. Would send to ${toAddr}: invited ${invitee}, temp pw (valid 1 day): ${tempPw}`,
        );
      }
      return;
    }
    const cleanPass = pass.replace(/^["']|["']$/g, '');
    const cleanUser = user.replace(/^["']|["']$/g, '');
    try {
      const transporter = nodemailer.createTransport({
        host,
        port: parseInt(port, 10),
        secure: process.env.SMTP_SECURE?.trim() === 'true',
        auth: { user: cleanUser, pass: cleanPass },
      });
      const from = AuthService.getMailFrom();
      await transporter.sendMail({
        from,
        to: effectiveTo,
        subject,
        text,
        html,
      });
    } catch (err) {
      console.error('[Invitation] Failed to send to', effectiveTo, err);
      if (isProduction) {
        console.error(
          '[Invitation] PRODUCTION: On Render, SMTP is often blocked. Use RESEND_API_KEY instead.',
        );
      }
    }
  }

  async resetPassword(dto: ResetPasswordDto) {
    const record = await this.prisma.passwordResetToken.findFirst({
      where: {
        token: dto.token,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
      include: { user: true },
    });

    if (!record) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    const user = record.user;
    if (!user || user.deletedAt) {
      throw new BadRequestException('User no longer exists');
    }

    const passwordHash = await bcrypt.hash(dto.newPassword, SALT_ROUNDS);

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: user.id },
        data: { passwordHash },
      }),
      this.prisma.passwordResetToken.update({
        where: { id: record.id },
        data: { usedAt: new Date() },
      }),
    ]);

    return {
      message: 'Password has been reset successfully. You can now log in.',
    };
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
    });

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('User not found');
    }

    const isCurrentValid = await bcrypt.compare(
      dto.currentPassword,
      user.passwordHash,
    );
    if (!isCurrentValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    const passwordHash = await bcrypt.hash(dto.newPassword, SALT_ROUNDS);
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash,
        mustChangePassword: false,
        temporaryPasswordExpiresAt: null,
      },
    });

    return {
      message: 'Password has been changed successfully.',
    };
  }

  private async generateTokens(userId: string, email: string, role: string) {
    const payload: JwtPayload = {
      sub: userId,
      email,
      role,
    };

    const accessToken = await this.jwtService.signAsync(payload, {
      secret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
      expiresIn: '15m', // Short-lived access token
    });

    const refreshToken = await this.jwtService.signAsync(payload, {
      secret:
        process.env.JWT_REFRESH_SECRET ||
        'your-refresh-secret-key-change-in-production',
      expiresIn: '7d', // Longer-lived refresh token
    });

    return {
      accessToken,
      refreshToken,
    };
  }
}
