import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { eq } from 'drizzle-orm';

import { DRIZZLE, type DrizzleDb } from '../drizzle/drizzle.module';
import { users } from '../drizzle/schema';

/**
 * Validates the bearer token and re-reads the identity row on every request, so
 * a deactivated account loses access immediately rather than when its access
 * token expires.
 *
 * This is infrastructure rather than a domain module, so it queries the
 * `users` table directly instead of importing `UsersService` — doing the latter
 * would create a cycle (CommonModule → UsersModule → CommonModule).
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private configService: ConfigService,
    @Inject(DRIZZLE) private readonly db: DrizzleDb
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      // `getOrThrow` both satisfies passport-jwt's non-optional `secretOrKey`
      // and fails the boot rather than the first login if the secret is absent.
      secretOrKey: configService.getOrThrow<string>('jwt.secret'),
      issuer: configService.get<string>('jwt.issuer'),
      audience: configService.get<string>('jwt.audience'),
    });
  }

  async validate(payload: { sub: string; email: string; role: string; typ?: string }) {
    // Access and refresh tokens share a signing secret, so without this check a
    // 7-day refresh token would authenticate every API call for a week.
    if (payload.typ !== 'access') {
      throw new UnauthorizedException('Invalid access token');
    }

    const [user] = await this.db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        role: users.role,
        isActive: users.isActive,
        abhaId: users.abhaId,
      })
      .from(users)
      .where(eq(users.id, payload.sub))
      .limit(1);

    if (!user || !user.isActive) {
      throw new UnauthorizedException('User not found or inactive');
    }

    return user;
  }
}
