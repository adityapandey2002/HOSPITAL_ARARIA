import {
  ForbiddenException,
  Injectable,
  Logger,
  OnModuleInit,
  ServiceUnavailableException,
} from '@nestjs/common';
import type { PoolClient } from 'pg';

import { DrizzleService } from '../../common/drizzle/drizzle.service';
import { runMigrations } from './db/migrate';
import { getArariaAvailability } from './api/araria';
import { runSync } from './sync/run';
import { pruneHistory } from './sync/retention';
import { EraktkoshSource } from './provider/eraktkosh';
import type { ArariaAvailability } from './api/araria';

/** Vercel enforces a 30s function timeout; leave headroom for the response. */
const SEED_TIMEOUT_MS = 20_000;

@Injectable()
export class EraktkoshService implements OnModuleInit {
  private readonly logger = new Logger(EraktkoshService.name);

  /**
   * Memoised schema check. `onModuleInit` runs it once, but a cold start can
   * outrun the database, so every request re-uses (or retries) it. A rejected
   * promise is never cached: the next request tries again.
   */
  private schemaReady: Promise<string[]> | null = null;

  /** Prevents a burst of first-visitor requests from all triggering a seed. */
  private bootstrapAttempted = false;

  /** Prevents overlapping background refreshes within one warm instance. */
  private refreshInFlight = false;

  constructor(private readonly drizzle: DrizzleService) {}

  async onModuleInit(): Promise<void> {
    // Never let the schema block bootstrap. If the database is briefly
    // unreachable the app must still start so /health/live can answer and the
    // platform (or the next request) can recover.
    try {
      const client = await this.drizzle.pool.connect();
      try {
        await this.ensureSchema(client);
      } finally {
        client.release();
      }
    } catch (error) {
      this.logger.error(
        `schema bootstrap deferred; will retry on next request: ${errorMessage(error)}`
      );
    }
  }

  private ensureSchema(client: PoolClient): Promise<string[]> {
    if (!this.schemaReady) {
      this.schemaReady = runMigrations(client as any)
        .then((applied) => {
          if (applied.length) this.logger.log(`migrations applied: ${applied.join(', ')}`);
          return applied;
        })
        .catch((error) => {
          this.schemaReady = null;
          throw error;
        });
    }
    return this.schemaReady;
  }

  async getAvailability() {
    const client = await this.drizzle.pool.connect();
    try {
      await this.ensureSchema(client);
      let availability = await getArariaAvailability(client as any);

      // A freshly provisioned database has no centres at all. Seed it on the
      // first read so the public page is immediately useful instead of waiting
      // for the nightly refresh. Bounded so a slow provider cannot turn the
      // first visitor's request into a timeout. The advisory lock inside
      // runSync keeps concurrent cold starts from syncing twice.
      if (availability.centers.length === 0 && !this.bootstrapAttempted) {
        this.bootstrapAttempted = true;
        try {
          await withTimeout(this.runSyncWith(client, 'backfill'), SEED_TIMEOUT_MS);
          availability = await getArariaAvailability(client as any);
        } catch (error) {
          this.logger.error(`first-run seed failed: ${errorMessage(error)}`);
        }
      }

      // If the data is older than the configured refresh interval, kick off a
      // best-effort refresh for the next visitor. Not awaited: Vercel gives the
      // function 30s, and serving slightly stale data with an honest timestamp
      // is better than holding the request open.
      if (availability.centers.length > 0 && isRefreshDue(availability)) {
        if (!this.refreshInFlight) {
          this.refreshInFlight = true;
          void this.refreshInBackground().finally(() => {
            this.refreshInFlight = false;
          });
        }
      }

      return availability;
    } finally {
      client.release();
    }
  }

  async sync(trigger: 'schedule' | 'manual' | 'backfill' = 'manual') {
    const client = await this.drizzle.pool.connect();
    try {
      await this.ensureSchema(client);
      return await this.runSyncWith(client, trigger);
    } finally {
      client.release();
    }
  }

  private runSyncWith(client: PoolClient, trigger: 'schedule' | 'manual' | 'backfill') {
    return runSync({
      db: client as any,
      source: new EraktkoshSource(),
      trigger,
      requestedBy: trigger === 'manual' ? 'api' : null,
      logger: (message) => this.logger.warn(message),
    });
  }

  /**
   * Stale data refresher. Uses its own pooled client because the request that
   * detected the staleness has already released its own.
   */
  private async refreshInBackground(): Promise<void> {
    let client: PoolClient | undefined;
    try {
      client = await this.drizzle.pool.connect();
      await this.ensureSchema(client);
      await this.runSyncWith(client, 'schedule');
    } catch (error) {
      this.logger.warn(`background refresh failed: ${errorMessage(error)}`);
    } finally {
      client?.release();
    }
  }

  /**
   * Entry point for the platform cron. Requires the shared secret so the
   * endpoint cannot be used to hammer the upstream provider.
   */
  async runScheduled(authorization?: string) {
    const secret = process.env.CRON_SECRET?.trim();
    if (!secret) {
      throw new ServiceUnavailableException('CRON_SECRET is not configured');
    }
    if (authorization !== `Bearer ${secret}`) {
      throw new ForbiddenException('invalid cron credentials');
    }

    const result = await this.sync('schedule');

    let retentionRemoved = 0;
    try {
      retentionRemoved = await this.retention();
    } catch (error) {
      this.logger.error(`retention after scheduled sync failed: ${errorMessage(error)}`);
    }

    return { ...result, retentionRemoved };
  }

  async retention(days?: number) {
    const client = await this.drizzle.pool.connect();
    try {
      await this.ensureSchema(client);
      return await pruneHistory(client as any, { days: days ?? 30 });
    } finally {
      client.release();
    }
  }
}

function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

/** Reject after `ms` so a slow upstream cannot hold a request open. */
function withTimeout<T>(work: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`timed out after ${ms}ms`)), ms);
    work.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      }
    );
  });
}

function isRefreshDue(availability: ArariaAvailability): boolean {
  if (!availability.asOf) return false;
  const ageMs = Date.now() - new Date(availability.asOf).getTime();
  return ageMs >= availability.refreshIntervalMinutes * 60_000;
}
