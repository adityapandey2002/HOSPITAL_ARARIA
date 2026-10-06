import { Controller, Get, Injectable } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import {
  HealthCheck,
  HealthCheckResult,
  HealthCheckService,
  HealthIndicator,
  HealthIndicatorResult,
} from '@nestjs/terminus';

import { DrizzleService } from '../../common/drizzle/drizzle.service';
import { PrismaService } from '../../common/prisma/prisma.service';

/**
 * Reports reachability for each data-access client so a saturated ORM pool
 * surfaces as an unhealthy pod instead of a stream of 500s.
 */
@Injectable()
export class DatabaseHealthIndicator extends HealthIndicator {
  constructor(
    private readonly prisma: PrismaService,
    private readonly drizzle: DrizzleService,
  ) {
    super();
  }

  async pingCheck(key: string): Promise<HealthIndicatorResult> {
    const [prismaOk, drizzleOk] = await Promise.all([
      this.prisma
        .$queryRaw`SELECT 1`
        .then(() => true)
        .catch(() => false),
      this.drizzle.healthCheck(),
    ]);

    const healthy = prismaOk && drizzleOk;

    return this.getStatus(key, healthy, {
      prisma: prismaOk ? 'up' : 'down',
      drizzle: drizzleOk ? 'up' : 'down',
      drizzlePool: this.drizzle.getPoolStats(),
    });
  }
}

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly database: DatabaseHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  @ApiOperation({ summary: 'Health check endpoint' })
  @ApiResponse({ status: 200, description: 'Service is healthy' })
  @ApiResponse({ status: 503, description: 'Service is unhealthy' })
  async check(): Promise<HealthCheckResult> {
    return this.health.check([() => this.database.pingCheck('database')]);
  }

  @Get('ready')
  @HealthCheck()
  @ApiOperation({ summary: 'Readiness check endpoint' })
  @ApiResponse({ status: 200, description: 'Service is ready' })
  @ApiResponse({ status: 503, description: 'Service is not ready' })
  async ready(): Promise<HealthCheckResult> {
    return this.health.check([() => this.database.pingCheck('database')]);
  }

  @Get('live')
  @ApiOperation({ summary: 'Liveness check endpoint' })
  @ApiResponse({ status: 200, description: 'Service is alive' })
  async live() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }
}