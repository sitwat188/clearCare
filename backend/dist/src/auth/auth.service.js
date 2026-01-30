"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const bcrypt = __importStar(require("bcrypt"));
const crypto_1 = require("crypto");
const prisma_service_1 = require("../prisma/prisma.service");
const RESET_TOKEN_EXPIRY_HOURS = 1;
const SALT_ROUNDS = 12;
const ROLE_PERMISSIONS = {
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
let AuthService = class AuthService {
    prisma;
    jwtService;
    constructor(prisma, jwtService) {
        this.prisma = prisma;
        this.jwtService = jwtService;
    }
    async register(registerDto, ipAddress, userAgent) {
        const existingUser = await this.prisma.user.findUnique({
            where: { email: registerDto.email.toLowerCase() },
        });
        if (existingUser) {
            throw new common_1.ConflictException('A user with this email already exists');
        }
        if (registerDto.role === 'administrator') {
            throw new common_1.BadRequestException('Creating Administrator users is disabled');
        }
        const saltRounds = 12;
        const passwordHash = await bcrypt.hash(registerDto.password, saltRounds);
        const user = await this.prisma.user.create({
            data: {
                email: registerDto.email.toLowerCase(),
                passwordHash,
                firstName: registerDto.firstName,
                lastName: registerDto.lastName,
                role: registerDto.role,
            },
        });
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
    async login(loginDto, ipAddress, userAgent) {
        const user = await this.prisma.user.findFirst({
            where: {
                email: loginDto.email.toLowerCase(),
                deletedAt: null,
            },
        });
        if (!user) {
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        const isPasswordValid = await bcrypt.compare(loginDto.password, user.passwordHash);
        if (!isPasswordValid) {
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        await this.prisma.user.update({
            where: { id: user.id },
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
    async validateUser(userId) {
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
    async refreshToken(refreshToken) {
        try {
            const payload = this.jwtService.verify(refreshToken, {
                secret: process.env.JWT_REFRESH_SECRET ||
                    'your-refresh-secret-key-change-in-production',
            });
            const user = await this.prisma.user.findFirst({
                where: {
                    id: payload.sub,
                    deletedAt: null,
                },
            });
            if (!user) {
                throw new common_1.UnauthorizedException('User not found');
            }
            return this.generateTokens(user.id, user.email, user.role);
        }
        catch (error) {
            throw new common_1.UnauthorizedException('Invalid refresh token');
        }
    }
    async forgotPassword(dto) {
        const email = dto.email.toLowerCase().trim();
        const user = await this.prisma.user.findFirst({
            where: { email, deletedAt: null },
        });
        if (!user) {
            return { message: 'If an account exists for this email, you will receive a password reset link.' };
        }
        const token = (0, crypto_1.randomBytes)(32).toString('hex');
        const expiresAt = new Date(Date.now() + RESET_TOKEN_EXPIRY_HOURS * 60 * 60 * 1000);
        await this.prisma.passwordResetToken.create({
            data: { email, token, expiresAt },
        });
        if (process.env.NODE_ENV !== 'production') {
            console.log(`[Password reset] Token for ${email}: ${token} (expires ${expiresAt.toISOString()})`);
        }
        return { message: 'If an account exists for this email, you will receive a password reset link.' };
    }
    async resetPassword(dto) {
        const record = await this.prisma.passwordResetToken.findFirst({
            where: {
                token: dto.token,
                usedAt: null,
                expiresAt: { gt: new Date() },
            },
        });
        if (!record) {
            throw new common_1.BadRequestException('Invalid or expired reset token');
        }
        const user = await this.prisma.user.findFirst({
            where: { email: record.email, deletedAt: null },
        });
        if (!user) {
            throw new common_1.BadRequestException('User no longer exists');
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
    async generateTokens(userId, email, role) {
        const payload = {
            sub: userId,
            email,
            role,
        };
        const accessToken = await this.jwtService.signAsync(payload, {
            secret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
            expiresIn: '15m',
        });
        const refreshToken = await this.jwtService.signAsync(payload, {
            secret: process.env.JWT_REFRESH_SECRET ||
                'your-refresh-secret-key-change-in-production',
            expiresIn: '7d',
        });
        return {
            accessToken,
            refreshToken,
        };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        jwt_1.JwtService])
], AuthService);
//# sourceMappingURL=auth.service.js.map