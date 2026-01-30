import { PrismaService } from '../prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
export declare class UsersService {
    private prisma;
    constructor(prisma: PrismaService);
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
}
