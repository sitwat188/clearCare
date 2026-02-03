import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { VerifyTwoFactorDto } from './dto/verify-two-factor.dto';
import { VerifySetupTwoFactorDto } from './dto/verify-setup-two-factor.dto';
import { DisableTwoFactorDto } from './dto/disable-two-factor.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    register(registerDto: RegisterDto, req: any): Promise<{
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
    login(loginDto: LoginDto, req: any): Promise<{
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
    refreshToken(dto: RefreshTokenDto): Promise<{
        accessToken: string;
        refreshToken: string;
    }>;
    forgotPassword(dto: ForgotPasswordDto): Promise<{
        message: string;
    }>;
    resetPassword(dto: ResetPasswordDto): Promise<{
        message: string;
    }>;
    verifyTwoFactor(dto: VerifyTwoFactorDto, req: any): Promise<{
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
    setupTwoFactor(user: {
        id: string;
    }): Promise<{
        secret: string;
        qrCodeDataUrl: string;
        setupToken: string;
        message: string;
    }>;
    verifySetupTwoFactor(dto: VerifySetupTwoFactorDto, user: {
        id: string;
    }): Promise<{
        backupCodes: string[];
        message: string;
    }>;
    disableTwoFactor(dto: DisableTwoFactorDto, user: {
        id: string;
    }): Promise<{
        message: string;
    }>;
    changePassword(dto: ChangePasswordDto, user: {
        id: string;
    }): Promise<{
        message: string;
    }>;
    getCurrentUser(user: any): Promise<{
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        role: string;
        permissions: string[];
        twoFactorEnabled: boolean;
    } | null>;
    logout(user: any, req: any): Promise<{
        message: string;
    }>;
}
