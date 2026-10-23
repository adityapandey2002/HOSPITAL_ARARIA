import { Controller, Get, Inject, Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { MikroORM } from '@mikro-orm/core';

import { DrizzleService } from '../../common/drizzle/drizzle.service';
import { MIKRO_ORM } from '../../common/mikro/mikro.module';
import { Public } from '../../common/decorators/public.decorator';

interface HealthDetail {
  status: 'up' | 'down';
  drizzle: 'up' | 'down';
  mikro: 'up' | 'down';
  drizzlePool: ReturnType<DrizzleService['getPoolStats']>;
}

interface HealthBody {
  status: 'ok' | 'error';
  info: Record<string, HealthDetail>;
  error: Record<string, HealthDetail>;
  details: Record<string, HealthDetail>;
}

/**
 * Probes both ORMs so a saturated pool on either one surfaces as an unhealthy
 * pod instead of a stream of 500s.
 *
 * Written by hand rather than with `@nestjs/terminus`: the only checks this
 * service needs are the two ORM connections, and Terminus's Prisma indicator
 * would reintroduce a client this refactor removed. The response body keeps
 * Terminus's shape so existing dashboards continue to parse it.
 */
@Injectable()
export class DatabaseHealthIndicator {
  constructor(
    private readonly drizzle: DrizzleService,
    @Inject(MIKRO_ORM) private readonly orm: MikroORM
  ) {}

  async probe(): Promise<HealthBody> {
    const [drizzleOk, mikroOk] = await Promise.all([
      this.drizzle.healthCheck(),
      this.orm.em
        .getConnection()
        .execute('SELECT 1')
        .then(() => true)
        .catch(() => false),
    ]);

    const healthy = drizzleOk && mikroOk;
    const detail: HealthDetail = {
      status: healthy ? 'up' : 'down',
      drizzle: drizzleOk ? 'up' : 'down',
      mikro: mikroOk ? 'up' : 'down',
      drizzlePool: this.drizzle.getPoolStats(),
    };

    return {
      status: healthy ? 'ok' : 'error',
      info: healthy ? { database: detail } : {},
      error: healthy ? {} : { database: detail },
      details: { database: detail },
    };
  }
}

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(private readonly database: DatabaseHealthIndicator) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'Health check endpoint' })
  @ApiResponse({ status: 200, description: 'Service is healthy' })
  @ApiResponse({ status: 503, description: 'Service is unhealthy' })
  async check(): Promise<HealthBody> {
    return this.assertHealthy();
  }

  @Get('ready')
  @Public()
  @ApiOperation({ summary: 'Readiness check endpoint' })
  @ApiResponse({ status: 200, description: 'Service is ready' })
  @ApiResponse({ status: 503, description: 'Service is not ready' })
  async ready(): Promise<HealthBody> {
    return this.assertHealthy();
  }

  @Get('live')
  @Public()
  @ApiOperation({ summary: 'Liveness check endpoint' })
  @ApiResponse({ status: 200, description: 'Service is alive' })
  async live() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }

  private async assertHealthy(): Promise<HealthBody> {
    const result = await this.database.probe();
    if (result.status !== 'ok') {
      // Passing the body to the exception keeps the 503 response in the same
      // shape as the 200 one.
      throw new ServiceUnavailableException(result);
    }
    return result;
  }
}
