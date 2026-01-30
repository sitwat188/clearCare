import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
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
    // Always return success to avoid email enumeration
    if (!user) {
      return { message: 'If an account exists for this email, you will receive a password reset link.' };
    }

    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + RESET_TOKEN_EXPIRY_HOURS * 60 * 60 * 1000);

    await this.prisma.passwordResetToken.create({
      data: { email, token, expiresAt },
    });

    // In production: send email with link containing token (e.g. https://app.example.com/reset-password?token=...)
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[Password reset] Token for ${email}: ${token} (expires ${expiresAt.toISOString()})`);
    }

    return { message: 'If an account exists for this email, you will receive a password reset link.' };
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

    return { message: 'Password has been reset successfully. You can now log in.' };
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
