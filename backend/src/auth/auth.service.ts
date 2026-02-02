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
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { JwtPayload } from './strategies/jwt.strategy';

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
