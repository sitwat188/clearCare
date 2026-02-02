import { EncryptionService } from '../common/encryption/encryption.service';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
export declare class UsersService {
    private prisma;
    private encryption;
    constructor(prisma: PrismaService, encryption: EncryptionService);
    getProfile(userId: string, requestingUserId: string, requestingUserRole: string): Promise<{
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        role: string;
        twoFactorEnabled: boolean;
        createdAt: Date;
        updatedAt: Date;
        lastLoginAt: Date | null;
    }>;
    updateProfile(userId: string, updateDto: UpdateProfileDto, requestingUserId: string, requestingUserRole: string, ipAddress?: string, userAgent?: string): Promise<{
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        role: string;
        updatedAt: Date;
    }>;
    setTwoFactorSecret(userId: string, secret: string): Promise<void>;
    setBackupCodes(userId: string, codesJson: string): Promise<void>;
    getTwoFactorSecret(userId: string): Promise<string | null>;
    getBackupCodes(userId: string): Promise<string | null>;
    clearTwoFactor(userId: string): Promise<void>;
}
