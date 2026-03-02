import { Controller, Get, Put, Body, Param, UseGuards, Req } from '@nestjs/common';
import type { Request } from 'express';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UpdateProfileDto } from './dto/update-profile.dto';

@ApiTags('users')
@ApiBearerAuth('access-token')
@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me/profile')
  @ApiOperation({ summary: 'Get current user profile' })
  async getMyProfile(@CurrentUser('id') userId: string, @CurrentUser('role') role: string) {
    return this.usersService.getProfile(userId, userId, role);
  }

  /**
   * Update current user's own profile (convenience endpoint)
   * PUT /api/v1/users/me/profile
   */
  @Put('me/profile')
  @ApiOperation({ summary: 'Update current user profile' })
  async updateMyProfile(
    @Body() updateDto: UpdateProfileDto,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: string,
    @Req() req: Request,
  ) {
    const ipAddress = req.ip ?? req.socket?.remoteAddress ?? undefined;
    const userAgent = typeof req.headers['user-agent'] === 'string' ? req.headers['user-agent'] : undefined;
    return this.usersService.updateProfile(userId, updateDto, userId, role, ipAddress, userAgent);
  }

  /**
   * Get user profile
   * GET /api/v1/users/:id/profile
   */
  @Get(':id/profile')
  @ApiOperation({ summary: 'Get user profile by ID' })
  async getProfile(
    @Param('id') userId: string,
    @CurrentUser('id') requestingUserId: string,
    @CurrentUser('role') requestingUserRole: string,
  ) {
    return this.usersService.getProfile(userId, requestingUserId, requestingUserRole);
  }

  /**
   * Update user profile
   * PUT /api/v1/users/:id/profile
   */
  @Put(':id/profile')
  @ApiOperation({ summary: 'Update user profile by ID' })
  async updateProfile(
    @Param('id') userId: string,
    @Body() updateDto: UpdateProfileDto,
    @CurrentUser('id') requestingUserId: string,
    @CurrentUser('role') requestingUserRole: string,
    @Req() req: Request,
  ) {
    const ipAddress = req.ip ?? req.socket?.remoteAddress ?? undefined;
    const userAgent = typeof req.headers['user-agent'] === 'string' ? req.headers['user-agent'] : undefined;
    return this.usersService.updateProfile(
      userId,
      updateDto,
      requestingUserId,
      requestingUserRole,
      ipAddress,
      userAgent,
    );
  }
}
