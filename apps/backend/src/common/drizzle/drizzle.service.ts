/**
 * DrizzleService
 * --------------
 * Owns the dedicated `pg.Pool` used by the Drizzle ORM (citizen-facing,
 * high-traffic services) and exposes the initialised Drizzle instance on
 * `this.db`.
 *
 * NOTE: The pool and the Drizzle instance are created in the constructor (not in
 * `onModuleInit`) so that the `DRIZZLE` injection token factory — which runs
 * during Nest provider instantiation — always observes a ready database handle.
 */
import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { drizzle, NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool, PoolConfig } from 'pg';

import * as schema from './schema';

export type DrizzleDb = NodePgDatabase<typeof schema>;

@Injectable()
export class DrizzleService implements OnModuleDestroy {
  private readonly logger = new Logger(DrizzleService.name);

  /** Underlying connection pool. Exposed for health checks and metrics only. */
  readonly pool: Pool;

  /** Initialised Drizzle instance — this is what consumers query through. */
  readonly db: DrizzleDb;

  constructor(config: ConfigService) {
    const poolConfig: PoolConfig = {
      host: config.get<string>('database.host'),
      port: config.get<number>('database.port'),
      user: config.get<string>('database.username'),
      password: config.get<string>('database.password'),
      database: config.get<string>('database.name'),
      max: config.get<number>('orm.drizzlePoolSize', 20),
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 5_000,
      ssl: config.get<string>('nodeEnv') === 'production' ? { rejectUnauthorized: false } : undefined,
    };

    this.pool = new Pool(poolConfig);
    this.db = drizzle(this.pool, {
      schema,
      logger: config.get<string>('nodeEnv') === 'development',
    });
  }

  async onModuleDestroy(): Promise<void> {
    await this.pool.end();
    this.logger.log('Drizzle connection pool closed');
  }

  /**
   * Run `fn` inside a single database transaction. The callback receives the
   * transaction-scoped Drizzle instance and everything it writes is rolled back
   * if it throws.
   */
  async transaction<T>(fn: (tx: DrizzleDb) => Promise<T>): Promise<T> {
    return this.db.transaction(fn as any) as Promise<T>;
  }

  /** Escape hatch for raw SQL / diagnostics. Prefer the query builder. */
  async execute(query: string, params: unknown[] = []): Promise<{ rows: any[]; rowCount: number | null }> {
    const result = await this.pool.query(query, params);
    return { rows: result.rows, rowCount: result.rowCount };
  }

  /** Readiness probe helper. */
  async healthCheck(): Promise<boolean> {
    try {
      await this.pool.query('SELECT 1');
      return true;
    } catch {
      return false;
    }
  }

  /** Pool utilisation snapshot for the `/health` endpoint and metrics export. */
  getPoolStats(): { total: number; idle: number; waiting: number } {
    return {
      total: this.pool.totalCount,
      idle: this.pool.idleCount,
      waiting: this.pool.waitingCount,
    };
  }
}