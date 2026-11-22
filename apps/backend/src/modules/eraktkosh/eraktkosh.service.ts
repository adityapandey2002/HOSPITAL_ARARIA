import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron } from '@nestjs/schedule';

import { DrizzleService } from '../../common/drizzle/drizzle.service';
import { runMigrations } from './db/migrate';
import { getArariaAvailability } from './api/araria';
import { runSync } from './sync/run';
import { pruneHistory } from './sync/retention';
import { EraktkoshSource } from './provider/eraktkosh';

@Injectable()
export class EraktkoshService implements OnModuleInit {
  private readonly logger = new Logger(EraktkoshService.name);

  constructor(
    private readonly drizzle: DrizzleService,
    private readonly config: ConfigService
  ) {}

  async onModuleInit(): Promise<void> {
    const client = await this.drizzle.pool.connect();
    try {
      const applied = await runMigrations(client as any);
      if (applied.length) this.logger.log(`migrations applied: ${applied.join(', ')}`);
    } finally {
      client.release();
    }
  }

  async getAvailability() {
    const client = await this.drizzle.pool.connect();
    try {
      return await getArariaAvailability(client as any);
    } finally {
      client.release();
    }
  }

  async sync(trigger: 'schedule' | 'manual' | 'backfill' = 'manual') {
    const client = await this.drizzle.pool.connect();
    try {
      return await runSync({
        db: client as any,
        source: new EraktkoshSource(),
        trigger,
        requestedBy: trigger === 'manual' ? 'api' : null,
        logger: (message) => this.logger.warn(message),
      });
    } finally {
      client.release();
    }
  }

  async retention(days?: number) {
    const client = await this.drizzle.pool.connect();
    try {
      return pruneHistory(client as any, { days: days ?? 30 });
    } finally {
      client.release();
    }
  }

  @Cron('0 */4 * * *')
  async scheduledSync(): Promise<void> {
    try {
      const result = await this.sync('schedule');
      this.logger.log(`scheduled sync ${result.runId}: ${result.status}`);
    } catch (error) {
      this.logger.error('scheduled sync failed', error as Error);
    }
  }
}
