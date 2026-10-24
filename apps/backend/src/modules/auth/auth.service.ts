import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { JwtService, type JwtSignOptions } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { createHash } from 'crypto';
import { ConfigService } from '@nestjs/config';

import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { TokenPayload } from './interfaces/token-payload.interface';

/**
 * Session and credential flows.
 *
 * All identity reads and writes go through `UsersService`, so the password hash
 * is never selected outside that module except by the two calls below that
 * genuinely compare it. This service owns no table.
 */
@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService
  ) {}

  async register(registerDto: RegisterDto) {
    const existingUser = await this.usersService.findByEmail(registerDto.email);
    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    if (registerDto.phone) {
      const existingPhone = await this.usersService.findByPhone(registerDto.phone);
      if (existingPhone) {
        throw new ConflictException('Phone number already registered');
      }
    }

    const hashedPassword = await bcrypt.hash(registerDto.password, 12);

    const user = await this.usersService.create({
      email: registerDto.email,
      password: hashedPassword,
      name: registerDto.name,
      phone: registerDto.phone,
      role: 'PATIENT',
    });

    const tokens = await this.generateTokens(user.id, user.email, user.role);

    return {
      user,
      ...tokens,
    };
  }

  async login(loginDto: LoginDto) {
    const user = await this.usersService.findByEmail(loginDto.email);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is deactivated');
    }

    const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const tokens = await this.generateTokens(user.id, user.email, user.role);

    return {
      // Explicit projection: `user` still carries the password hash for the
      // comparison above, so it must never be spread into the response.
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        role: user.role,
        abhaId: user.abhaId,
      },
      ...tokens,
    };
  }

  async refreshTokens(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>('jwt.secret'),
      });

      const user = await this.usersService.findByIdOrNull(payload.sub);

      if (!user || !user.isActive) {
        throw new UnauthorizedException('User not found or inactive');
      }

      return this.generateTokens(user.id, user.email, user.role);
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async logout(_userId: string) {
    // Stateless JWTs: the client discards the tokens. Revocation would need a
    // refresh-token denylist, which is not implemented yet.
    return { success: true, message: 'Logged out successfully' };
  }

  async validateUser(payload: TokenPayload) {
    const user = await this.usersService.findByIdOrNull(payload.sub);

    if (!user || !user.isActive) {
      throw new UnauthorizedException('User not found or inactive');
    }

    return user;
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await this.usersService.findByIdWithPassword(userId);

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);

    if (!isPasswordValid) {
      throw new BadRequestException('Current password is incorrect');
    }

    await this.usersService.updatePassword(userId, newPassword);

    return { success: true, message: 'Password changed successfully' };
  }

  /**
   * Issues a short-lived, single-use reset token.
   *
   * The token is a JWT signed with a secret derived from the application secret
   * and bound to the current password hash. Changing the password invalidates
   * every outstanding token for that account, which is what makes it single-use
   * without adding a `password_reset_tokens` table.
   */
  async forgotPassword(email: string) {
    const user = await this.usersService.findByEmail(email);

    // Always return the same message so the endpoint cannot be used to
    // enumerate registered addresses.
    if (!user) {
      return { success: true, message: 'If the email exists, a reset link has been sent' };
    }

    const token = this.signResetToken(user.id, user.email, user.password);

    // No SMTP transport is wired up yet. Log the token in development so the
    // flow is usable, and in development only return it to the caller; staging
    // and production never expose it.
    const nodeEnv = this.configService.get<string>('nodeEnv', 'development');
    this.logger.debug(`Password reset token for ${user.email}: ${token}`);

    return {
      success: true,
      message: 'If the email exists, a reset link has been sent',
      ...(nodeEnv === 'development' ? { resetToken: token } : {}),
    };
  }

  async resetPassword(token: string, newPassword: string) {
    let payload: { sub: string; email: string; purpose: string; pwd: string };

    try {
      payload = this.jwtService.verify(token, { secret: this.resetSecret() });
    } catch {
      throw new BadRequestException('Invalid or expired reset token');
    }

    if (payload.purpose !== 'password-reset') {
      throw new BadRequestException('Invalid or expired reset token');
    }

    const user = await this.usersService.findByIdWithPassword(payload.sub);
    if (!user || !user.isActive) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    // A token issued before the last password change no longer matches.
    if (this.passwordFingerprint(user.password) !== payload.pwd) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    await this.usersService.updatePassword(user.id, newPassword);

    return { success: true, message: 'Password reset successfully' };
  }

  private resetSecret(): string {
    // Deriving a separate key means a reset token can never be replayed as an
    // access token, even if the JWT payload shapes were to converge.
    return `${this.configService.getOrThrow<string>('jwt.secret')}:password-reset`;
  }

  private passwordFingerprint(hash: string): string {
    return createHash('sha256').update(hash).digest('hex').slice(0, 32);
  }

  private signResetToken(userId: string, email: string, passwordHash: string): string {
    return this.jwtService.sign(
      {
        sub: userId,
        email,
        purpose: 'password-reset',
        pwd: this.passwordFingerprint(passwordHash),
      },
      { secret: this.resetSecret(), expiresIn: '15m' }
    );
  }

  private async generateTokens(userId: string, email: string, role: string) {
    const payload: TokenPayload = {
      sub: userId,
      email,
      role,
    };

    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: this.configService.get<JwtSignOptions['expiresIn']>('jwt.refreshTokenExpiry'),
    });

    return {
      accessToken,
      refreshToken,
    };
  }
}
