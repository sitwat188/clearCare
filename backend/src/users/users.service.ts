import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  /**
   * Get user profile by ID
   * HIPAA: Users can only view their own profile, admins can view any
   */
  async getProfile(userId: string, requestingUserId: string, requestingUserRole: string) {
    // HIPAA: Row-level access control - users can only access their own data
    if (requestingUserRole !== 'administrator' && userId !== requestingUserId) {
      throw new ForbiddenException('You can only access your own profile');
    }

    const user = await this.prisma.user.findFirst({
      where: {
        id: userId,
        deletedAt: null, // Exclude soft-deleted users
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
      throw new NotFoundException('User not found');
    }

    return user;
  }

  /**
   * Update user profile
   * HIPAA: Users can only update their own profile, admins can update any
   */
  async updateProfile(
    userId: string,
    updateDto: UpdateProfileDto,
    requestingUserId: string,
    requestingUserRole: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    // HIPAA: Row-level access control
    if (requestingUserRole !== 'administrator' && userId !== requestingUserId) {
      throw new ForbiddenException('You can only update your own profile');
    }

    const user = await this.prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Get old values for history
    const oldValues = {
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
    };

    // Update user
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

    // Create history entry
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
}
