import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { EncryptionService } from '../common/encryption/encryption.service';
import { redactPHIFromObject } from '../common/redact-phi';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private encryption: EncryptionService,
  ) {}

  /**
   * Get user profile by ID
   * HIPAA: Users can only view their own profile, admins can view any
   */
  async getProfile(
    userId: string,
    requestingUserId: string,
    requestingUserRole: string,
  ) {
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

    return {
      ...user,
      email: this.encryption.decrypt(user.email),
      firstName: this.encryption.decrypt(user.firstName),
      lastName: this.encryption.decrypt(user.lastName),
    };
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

    const oldValuesEnc = {
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
    };
    const updateData: {
      email?: string;
      firstName?: string;
      lastName?: string;
      emailHash?: string;
      updatedAt: Date;
    } = { updatedAt: new Date() };
    if (updateDto.email) {
      const normalized = updateDto.email.toLowerCase().trim();
      updateData.emailHash = this.encryption.hashEmailForLookup(normalized);
      updateData.email = this.encryption.encrypt(normalized);
    }
    if (updateDto.firstName !== undefined)
      updateData.firstName = this.encryption.encrypt(updateDto.firstName);
    if (updateDto.lastName !== undefined)
      updateData.lastName = this.encryption.encrypt(updateDto.lastName);

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: updateData,
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
        oldValues: redactPHIFromObject(oldValuesEnc),
        newValues: redactPHIFromObject({
          email: updatedUser.email,
          firstName: updatedUser.firstName,
          lastName: updatedUser.lastName,
        }),
        ipAddress,
        userAgent,
      },
    });

    return {
      ...updatedUser,
      email: this.encryption.decrypt(updatedUser.email),
      firstName: this.encryption.decrypt(updatedUser.firstName),
      lastName: this.encryption.decrypt(updatedUser.lastName),
    };
  }

  /**
   * Set 2FA secret (encrypted at rest). Use when enabling 2FA.
   */
  async setTwoFactorSecret(userId: string, secret: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorSecret: this.encryption.encrypt(secret),
        twoFactorEnabled: true,
      },
    });
  }

  /**
   * Set backup codes (encrypted at rest). Use when enabling 2FA.
   */
  async setBackupCodes(userId: string, codesJson: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { backupCodes: this.encryption.encrypt(codesJson) },
    });
  }

  /**
   * Get 2FA secret (decrypted). Use for TOTP verification only; do not expose to API response.
   */
  async getTwoFactorSecret(userId: string): Promise<string | null> {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
      select: { twoFactorSecret: true },
    });
    if (!user?.twoFactorSecret) return null;
    const decrypted = this.encryption.decrypt(user.twoFactorSecret);
    return decrypted || null;
  }

  /**
   * Get backup codes (decrypted). Use when verifying backup code only; do not expose to API response.
   */
  async getBackupCodes(userId: string): Promise<string | null> {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
      select: { backupCodes: true },
    });
    if (!user?.backupCodes) return null;
    const decrypted = this.encryption.decrypt(user.backupCodes);
    return decrypted || null;
  }

  /**
   * Clear 2FA (disable 2FA for user). Removes secret and backup codes.
   */
  async clearTwoFactor(userId: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorEnabled: false,
        twoFactorSecret: null,
        backupCodes: null,
      },
    });
  }
}
