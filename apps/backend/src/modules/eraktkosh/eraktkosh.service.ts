import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron } from '@nestjs/schedule';

import { DrizzleService } from '../../common/drizzle/drizzle.service';
import { runMigrations } from './db/migrate';
import { getArariaAvailability } from './api/araria';
import { runSync } from './sync/run';
import { pruneHistory } from './sync/retention';
import { EraktkoshSource } from './provider/eraktkosh';

const AUTO_SYNC_MAX_AGE_MINUTES = Number(process.env.ERAKTKOSH_AUTO_SYNC_MAX_AGE_MINUTES ?? 30);
const MANUAL_REFRESH_COOLDOWN_MS = 60_000;

@Injectable()
export class EraktkoshService implements OnModuleInit {
  private readonly logger = new Logger(EraktkoshService.name);
  private activeSync: Promise<Awaited<ReturnType<typeof runSync>>> | null = null;
  private lastSyncCompletedAt = 0;

  constructor(
    private readonly drizzle: DrizzleService,
    private readonly config: ConfigService
  ) {}

  async onModuleInit(): Promise<void> {
    try {
      const client = await this.drizzle.pool.connect();
      try {
        const applied = await runMigrations(client as any);
        if (applied.length) this.logger.log(`migrations applied: ${applied.join(', ')}`);
      } finally {
        client.release();
      }
    } catch (error) {
      this.logger.error(
        `e-RaktKosh migration check failed during init: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }

    // Trigger a non-blocking freshness check after boot on long-lived servers
    // (skip eager background work on serverless cold starts where requests invoke on-demand refresh)
    if (process.env.NODE_ENV !== 'test' && !process.env.VERCEL) {
      void this.ensureFreshAvailability(false).catch((error) => {
        this.logger.warn(
          `Initial e-RaktKosh sync check failed: ${error instanceof Error ? error.message : String(error)}`
        );
      });
    }
  }

  private async readAvailability() {
    const client = await this.drizzle.pool.connect();
    try {
      return await getArariaAvailability(client as any);
    } finally {
      client.release();
    }
  }

  private async ensureFreshAvailability(forceRefresh: boolean) {
    const current = await this.readAvailability();
    const nowMs = Date.now();
    const snapshotAgeMinutes = current.asOf
      ? (nowMs - new Date(current.asOf).getTime()) / 60_000
      : Number.POSITIVE_INFINITY;

    const needsSync =
      current.centers.length === 0 ||
      snapshotAgeMinutes > AUTO_SYNC_MAX_AGE_MINUTES ||
      (forceRefresh && nowMs - this.lastSyncCompletedAt >= MANUAL_REFRESH_COOLDOWN_MS);

    if (!needsSync) {
      return current;
    }

    try {
      await this.sync(forceRefresh ? 'manual' : 'schedule');
      return await this.readAvailability();
    } catch (error) {
      this.logger.warn(
        `On-demand e-RaktKosh sync failed; returning cached snapshot: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
      return current;
    }
  }

  async getAvailability(options: { refresh?: boolean } = {}) {
    return this.ensureFreshAvailability(Boolean(options.refresh));
  }

  async sync(trigger: 'schedule' | 'manual' = 'manual') {
    if (this.activeSync) {
      return this.activeSync;
    }

    this.activeSync = (async () => {
      const client = await this.drizzle.pool.connect();
      try {
        const result = await runSync({
          db: client as any,
          source: new EraktkoshSource(),
          trigger,
          requestedBy: trigger === 'manual' ? 'api' : null,
          logger: (message) => this.logger.warn(message),
        });
        this.lastSyncCompletedAt = Date.now();
        return result;
      } finally {
        client.release();
        this.activeSync = null;
      }
    })();

    return this.activeSync;
  }

  async retention(days?: number) {
    const client = await this.drizzle.pool.connect();
    try {
      return pruneHistory(client as any, { days: days ?? 30 });
    } finally {
      client.release();
    }
  }

  @Cron('0 */2 * * *')
  async scheduledSync(): Promise<void> {
    try {
      const result = await this.sync('schedule');
      this.logger.log(`scheduled sync ${result.runId}: ${result.status}`);
    } catch (error) {
      this.logger.error('scheduled sync failed', error as Error);
    }
  }
}
