import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
export declare class AuthService {
    private prisma;
    private jwtService;
    private usersService;
    constructor(prisma: PrismaService, jwtService: JwtService, usersService: UsersService);
    register(registerDto: RegisterDto, ipAddress?: string, userAgent?: string): Promise<{
        accessToken: string;
        refreshToken: string;
        user: {
            id: string;
            email: string;
            firstName: string;
            lastName: string;
            role: string;
            permissions: string[];
            createdAt: Date;
        };
    }>;
    login(loginDto: LoginDto, ipAddress?: string, userAgent?: string): Promise<{
        requiresTwoFactor: boolean;
        twoFactorToken: string;
        message: string;
    } | {
        accessToken: string;
        refreshToken: string;
        user: {
            id: string;
            email: string;
            firstName: string;
            lastName: string;
            role: string;
            permissions: string[];
            lastLoginAt: Date | null;
        };
        requiresTwoFactor?: undefined;
        twoFactorToken?: undefined;
        message?: undefined;
    }>;
    verifyTwoFactorLogin(twoFactorToken: string, code: string, ipAddress?: string, userAgent?: string): Promise<{
        accessToken: string;
        refreshToken: string;
        user: {
            id: string;
            email: string;
            firstName: string;
            lastName: string;
            role: string;
            permissions: string[];
            lastLoginAt: Date | null;
        };
    }>;
    setupTwoFactor(userId: string): Promise<{
        secret: string;
        qrCodeDataUrl: string;
        setupToken: string;
        message: string;
    }>;
    verifySetupTwoFactor(setupToken: string, code: string, userId: string): Promise<{
        backupCodes: string[];
        message: string;
    }>;
    disableTwoFactor(userId: string, password: string): Promise<{
        message: string;
    }>;
    private generateBackupCodes;
    validateUser(userId: string): Promise<{
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        role: string;
        permissions: string[];
        twoFactorEnabled: boolean;
    } | null>;
    refreshToken(refreshToken: string): Promise<{
        accessToken: string;
        refreshToken: string;
    }>;
    forgotPassword(dto: ForgotPasswordDto): Promise<{
        message: string;
    }>;
    private sendPasswordResetEmail;
    resetPassword(dto: ResetPasswordDto): Promise<{
        message: string;
    }>;
    private generateTokens;
}
