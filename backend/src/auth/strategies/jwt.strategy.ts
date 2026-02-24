import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../prisma/prisma.service';
import { EncryptionService } from '../../common/encryption/encryption.service';
import { getJwtSecret } from '../jwt-secret';

export interface JwtPayload {
  sub: string; // user id
  email: string;
  role: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private prisma: PrismaService,
    private encryption: EncryptionService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: getJwtSecret(),
    });
  }

  async validate(payload: JwtPayload) {
    // Verify user still exists and is not soft-deleted
    const user = await this.prisma.user.findFirst({
      where: {
        id: payload.sub,
        deletedAt: null, // Exclude soft-deleted users
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found or has been deleted');
    }

    // Return user object (decrypted) for request.user so UI shows plaintext name/email
    return {
      id: user.id,
      email: this.encryption.decrypt(user.email) ?? '',
      role: user.role,
      firstName: this.encryption.decrypt(user.firstName) ?? '',
      lastName: this.encryption.decrypt(user.lastName) ?? '',
    };
  }
}
