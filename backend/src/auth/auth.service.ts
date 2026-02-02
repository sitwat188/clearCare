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
import * as speakeasy from 'speakeasy';
import * as QRCode from 'qrcode';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { JwtPayload } from './strategies/jwt.strategy';

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
  ) {}

  async register(
    registerDto: RegisterDto,
    ipAddress?: string,
    userAgent?: string,
  ) {
    // Check if user already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: registerDto.email.toLowerCase() },
    });

    if (existingUser) {
      throw new ConflictException('A user with this email already exists');
    }

    // HIPAA: Prevent creating administrator users via registration
    if (registerDto.role === 'administrator') {
      throw new BadRequestException('Creating Administrator users is disabled');
    }

    // Hash password
    const saltRounds = 12; // HIPAA: Strong password hashing
    const passwordHash = await bcrypt.hash(registerDto.password, saltRounds);

    // Create user
    const user = await this.prisma.user.create({
      data: {
        email: registerDto.email.toLowerCase(),
        passwordHash,
        firstName: registerDto.firstName,
        lastName: registerDto.lastName,
        role: registerDto.role,
      },
    });

    // Create user history entry
    await this.prisma.userHistory.create({
      data: {
        userId: user.id,
        action: 'create',
        changedBy: user.id,
        newValues: {
          email: user.email,
          role: user.role,
          firstName: user.firstName,
          lastName: user.lastName,
        },
        ipAddress,
        userAgent,
      },
    });

    // Generate tokens
    const tokens = await this.generateTokens(user.id, user.email, user.role);

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        permissions: ROLE_PERMISSIONS[user.role] || [],
        createdAt: user.createdAt,
      },
      ...tokens,
    };
  }

  async login(loginDto: LoginDto, ipAddress?: string, userAgent?: string) {
    // Find user (exclude soft-deleted)
    const user = await this.prisma.user.findFirst({
      where: {
        email: loginDto.email.toLowerCase(),
        deletedAt: null,
      },
    });

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
          secret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
          expiresIn: '5m',
        },
      );
      return {
        requiresTwoFactor: true,
        twoFactorToken,
        message: 'Enter your authenticator or backup code to complete login.',
      };
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

    // Generate tokens
    const tokens = await this.generateTokens(user.id, user.email, user.role);

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        permissions: ROLE_PERMISSIONS[user.role] || [],
        lastLoginAt: user.lastLoginAt,
      },
      ...tokens,
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
          secret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
        },
      );
    } catch {
      throw new UnauthorizedException('Invalid or expired 2FA session. Please log in again.');
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

    const tokens = await this.generateTokens(user.id, user.email, user.role);
    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        permissions: ROLE_PERMISSIONS[user.role] || [],
        lastLoginAt: user.lastLoginAt,
      },
      ...tokens,
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
      name: `${TWO_FACTOR_APP_NAME} (${user.email})`,
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
        secret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
        expiresIn: '10m',
      },
    );

    return {
      secret: secret.base32,
      qrCodeDataUrl,
      setupToken,
      message: 'Scan the QR code with your authenticator app, then enter the 6-digit code to verify.',
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
        secret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
      });
    } catch {
      throw new UnauthorizedException('Setup link expired. Please start 2FA setup again.');
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

    await this.usersService.setTwoFactorSecret(payload.sub, payload.twoFactorSecret);

    const backupCodes = this.generateBackupCodes();
    await this.usersService.setBackupCodes(
      payload.sub,
      JSON.stringify(backupCodes),
    );

    return {
      backupCodes,
      message: '2FA has been enabled. Save your backup codes in a secure place.',
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

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
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

      return this.generateTokens(user.id, user.email, user.role);
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const email = dto.email.toLowerCase().trim();
    const user = await this.prisma.user.findFirst({
      where: { email, deletedAt: null },
    });

    if (!user) {
      throw new NotFoundException('No account found with this email address.');
    }

    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(
      Date.now() + RESET_TOKEN_EXPIRY_HOURS * 60 * 60 * 1000,
    );

    await this.prisma.passwordResetToken.create({
      data: { email, token, expiresAt },
    });

    const resetEmailTo = process.env.PASSWORD_RESET_REDIRECT_EMAIL || '';
    const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${token}`;

    await this.sendPasswordResetEmail(
      resetEmailTo,
      resetLink,
      expiresAt,
      email,
    );

    return {
      message: 'A password reset link has been sent. Please check your inbox.',
    };
  }

  /**
   * Send password reset email. If SMTP is not configured, logs the link to console.
   */
  private async sendPasswordResetEmail(
    to: string,
    resetLink: string,
    expiresAt: Date,
    requestedForEmail: string,
  ): Promise<void> {
    const host = process.env.SMTP_HOST?.trim();
    const port = process.env.SMTP_PORT?.trim();
    const user = process.env.SMTP_USER?.trim();
    const pass = process.env.SMTP_PASS?.trim();

    if (host && port && user && pass) {
      // Strip surrounding quotes if env loader left them
      const cleanPass = pass.replace(/^["']|["']$/g, '');
      const cleanUser = user.replace(/^["']|["']$/g, '');
      console.log(
        `[Password reset] Attempting to send email to ${to} via ${host}:${port} (SMTP_USER=${cleanUser}, pass length=${cleanPass.length})`,
      );
      try {
        const transporter = nodemailer.createTransport({
          host,
          port: parseInt(port, 10),
          secure: process.env.SMTP_SECURE?.trim() === 'true',
          auth: { user: cleanUser, pass: cleanPass },
        });
        const from =
          process.env.MAIL_FROM?.trim() || `ClearCare <${cleanUser}>`;
        await transporter.sendMail({
          from,
          to,
          subject: 'Reset your password - ClearCare',
          text: `A password reset was requested for ${requestedForEmail}. Use this link to reset your password (expires ${expiresAt.toISOString()}): ${resetLink}`,
          html: `<p>A password reset was requested for <strong>${requestedForEmail}</strong>.</p><p>Use this link to reset your password (valid for 1 hour):</p><p><a href="${resetLink}">${resetLink}</a></p><p>If you did not request this, you can ignore this email.</p>`,
        });
        console.log(`[Password reset] Email sent successfully to ${to}`);
      } catch (err: any) {
        const msg = err?.message ?? String(err);
        console.error('[Password reset] Failed to send email:', msg);
        if (err?.response)
          console.error('[Password reset] SMTP response:', err.response);
        console.log(
          `[Password reset] Fallback link for ${requestedForEmail} → ${to}: ${resetLink} (expires ${expiresAt.toISOString()})`,
        );
      }
    } else {
      console.log(
        `[Password reset] SMTP not configured (need SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS). Link for ${requestedForEmail} → ${to}: ${resetLink} (expires ${expiresAt.toISOString()})`,
      );
    }
  }

  async resetPassword(dto: ResetPasswordDto) {
    const record = await this.prisma.passwordResetToken.findFirst({
      where: {
        token: dto.token,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
    });

    if (!record) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    const user = await this.prisma.user.findFirst({
      where: { email: record.email, deletedAt: null },
    });

    if (!user) {
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
