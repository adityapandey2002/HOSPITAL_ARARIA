// Drizzle Service - Wrapper for Drizzle ORM with connection pooling, logging, and health checks
import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { drizzle, NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool, PoolConfig } from 'pg';
import * as schema from './schema';

export type DrizzleDb = NodePgDatabase<typeof schema>;

@Injectable()
export class DrizzleService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DrizzleService.name);
  private pool: Pool;
  public db: NodePgDatabase<typeof schema>;

  async onModuleInit() {
    const poolConfig: PoolConfig = {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      user: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.DB_NAME || 'dh_araria',
      max: parseInt(process.env.DRIZZLE_POOL_SIZE || '20'),
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    };

    this.pool = new Pool(poolConfig);
    this.db = drizzle(this.pool, { schema, logger: true });

    // Test connection
    try {
      await this.pool.query('SELECT 1');
      this.logger.log('Drizzle ORM connected to PostgreSQL');
    } catch (error) {
      this.logger.error('Failed to connect to PostgreSQL', error);
      throw error;
    }
  }

  async onModuleDestroy() {
    await this.pool.end();
    this.logger.log('Drizzle ORM connection pool closed');
  }

  /**
   * Execute a transaction with automatic rollback on error
   */
  async transaction<T>(fn: (tx: any) => Promise<T>): Promise<T> {
    return this.db.transaction(fn);
  }

  /**
   * Execute raw SQL
   */
  async execute(sql: string, params?: any[]): Promise<any> {
    return this.pool.query(sql, params);
  }

  /**
   * Health check for readiness probe
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.pool.query('SELECT 1');
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get pool statistics for monitoring
   */
  getPoolStats(): { total: number; idle: number; waiting: number } {
    return {
      total: this.pool.totalCount,
      idle: this.pool.idleCount,
      waiting: this.pool.waitingCount,
    };
  }
}

export { schema };