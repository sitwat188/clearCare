import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    getMyProfile(userId: string, role: string): Promise<{
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
    updateMyProfile(updateDto: UpdateProfileDto, userId: string, role: string, req: any): Promise<{
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        role: string;
        updatedAt: Date;
    }>;
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
    updateProfile(userId: string, updateDto: UpdateProfileDto, requestingUserId: string, requestingUserRole: string, req: any): Promise<{
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        role: string;
        updatedAt: Date;
    }>;
}
