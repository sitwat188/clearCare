"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const encryption_service_1 = require("../common/encryption/encryption.service");
const prisma_service_1 = require("../prisma/prisma.service");
let UsersService = class UsersService {
    prisma;
    encryption;
    constructor(prisma, encryption) {
        this.prisma = prisma;
        this.encryption = encryption;
    }
    async getProfile(userId, requestingUserId, requestingUserRole) {
        if (requestingUserRole !== 'administrator' && userId !== requestingUserId) {
            throw new common_1.ForbiddenException('You can only access your own profile');
        }
        const user = await this.prisma.user.findFirst({
            where: {
                id: userId,
                deletedAt: null,
            },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true,
                twoFactorEnabled: true,
                createdAt: true,
                updatedAt: true,
                lastLoginAt: true,
            },
        });
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        return user;
    }
    async updateProfile(userId, updateDto, requestingUserId, requestingUserRole, ipAddress, userAgent) {
        if (requestingUserRole !== 'administrator' && userId !== requestingUserId) {
            throw new common_1.ForbiddenException('You can only update your own profile');
        }
        const user = await this.prisma.user.findFirst({
            where: { id: userId, deletedAt: null },
        });
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        const oldValues = {
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
        };
        const updatedUser = await this.prisma.user.update({
            where: { id: userId },
            data: {
                ...(updateDto.email && { email: updateDto.email.toLowerCase() }),
                ...(updateDto.firstName && { firstName: updateDto.firstName }),
                ...(updateDto.lastName && { lastName: updateDto.lastName }),
                updatedAt: new Date(),
            },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true,
                updatedAt: true,
            },
        });
        await this.prisma.userHistory.create({
            data: {
                userId: user.id,
                action: 'update',
                changedBy: requestingUserId,
                oldValues,
                newValues: {
                    email: updatedUser.email,
                    firstName: updatedUser.firstName,
                    lastName: updatedUser.lastName,
                },
                ipAddress,
                userAgent,
            },
        });
        return updatedUser;
    }
    async setTwoFactorSecret(userId, secret) {
        await this.prisma.user.update({
            where: { id: userId },
            data: {
                twoFactorSecret: this.encryption.encrypt(secret),
                twoFactorEnabled: true,
            },
        });
    }
    async setBackupCodes(userId, codesJson) {
        await this.prisma.user.update({
            where: { id: userId },
            data: { backupCodes: this.encryption.encrypt(codesJson) },
        });
    }
    async getTwoFactorSecret(userId) {
        const user = await this.prisma.user.findFirst({
            where: { id: userId, deletedAt: null },
            select: { twoFactorSecret: true },
        });
        if (!user?.twoFactorSecret)
            return null;
        const decrypted = this.encryption.decrypt(user.twoFactorSecret);
        return decrypted || null;
    }
    async getBackupCodes(userId) {
        const user = await this.prisma.user.findFirst({
            where: { id: userId, deletedAt: null },
            select: { backupCodes: true },
        });
        if (!user?.backupCodes)
            return null;
        const decrypted = this.encryption.decrypt(user.backupCodes);
        return decrypted || null;
    }
    async clearTwoFactor(userId) {
        await this.prisma.user.update({
            where: { id: userId },
            data: {
                twoFactorEnabled: false,
                twoFactorSecret: null,
                backupCodes: null,
            },
        });
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        encryption_service_1.EncryptionService])
], UsersService);
//# sourceMappingURL=users.service.js.map