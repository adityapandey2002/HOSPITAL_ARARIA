/**
 * BaseDrizzleRepository
 * ---------------------
 * Thin generic CRUD/pagination helper for citizen-facing tables.
 *
 * The Drizzle query builder is deliberately kept in the services (they own the
 * joins/filters that make each endpoint special); this base class only removes
 * the repetitive find/create/update/delete boilerplate.
 */
import { Inject } from '@nestjs/common';
import { and, asc, count, desc, eq, SQL } from 'drizzle-orm';
import { AnyPgColumn, AnyPgTable } from 'drizzle-orm/pg-core';

import { DrizzleDb, DRIZZLE } from './drizzle.module';

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResult<T> {
  data: T[];
  meta: PaginatedMeta;
}

export type SortOrder = 'asc' | 'desc';

export abstract class BaseDrizzleRepository<
  TTable extends AnyPgTable,
  TSelect = Record<string, unknown>,
  TInsert = Record<string, unknown>,
> {
  protected abstract readonly table: TTable;
  protected abstract readonly idColumn: AnyPgColumn;

  constructor(@Inject(DRIZZLE) protected readonly db: DrizzleDb) {}

  /** Resolve a camelCase API field name to a real column, or `undefined`. */
  protected column(field: string): AnyPgColumn | undefined {
    return (this.table as Record<string, unknown>)[field] as AnyPgColumn | undefined;
  }

  protected orderBy(field: string, order: SortOrder = 'desc'): SQL<unknown> {
    const column = this.column(field) ?? this.idColumn;
    return order === 'asc' ? asc(column) : desc(column);
  }

  async findById(id: string): Promise<TSelect | null> {
    const rows = await this.db.select().from(this.table).where(eq(this.idColumn, id)).limit(1);
    return (rows[0] as unknown as TSelect) ?? null;
  }

  async findOne(where: SQL<unknown>): Promise<TSelect | null> {
    const rows = await this.db.select().from(this.table).where(where).limit(1);
    return (rows[0] as unknown as TSelect) ?? null;
  }

  async findMany(where?: SQL<unknown>): Promise<TSelect[]> {
    const rows = await this.db.select().from(this.table).where(where);
    return rows as unknown as TSelect[];
  }

  async findAll(
    pagination: PaginationParams = {},
    where?: SQL<unknown>,
  ): Promise<PaginatedResult<TSelect>> {
    const page = Math.max(1, pagination.page ?? 1);
    const limit = Math.min(100, Math.max(1, pagination.limit ?? 20));
    const offset = (page - 1) * limit;

    const orderBy = this.orderBy(pagination.sortBy ?? 'createdAt', pagination.sortOrder ?? 'desc');

    const [rows, totals] = await Promise.all([
      this.db.select().from(this.table).where(where).orderBy(orderBy).limit(limit).offset(offset),
      this.db.select({ value: count() }).from(this.table).where(where),
    ]);

    const total = totals[0]?.value ?? 0;

    return {
      data: rows as unknown as TSelect[],
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async create(data: TInsert): Promise<TSelect> {
    const rows = await this.db.insert(this.table).values(data as any).returning();
    return rows[0] as unknown as TSelect;
  }

  async createMany(data: TInsert[]): Promise<TSelect[]> {
    if (data.length === 0) return [];
    const rows = await this.db.insert(this.table).values(data as any).returning();
    return rows as unknown as TSelect[];
  }

  async update(id: string, data: Partial<TInsert>): Promise<TSelect | null> {
    const rows = await this.db
      .update(this.table)
      .set(data as any)
      .where(eq(this.idColumn, id))
      .returning();
    return (rows[0] as unknown as TSelect) ?? null;
  }

  async delete(id: string): Promise<boolean> {
    const rows = await this.db.delete(this.table).where(eq(this.idColumn, id)).returning();
    return rows.length > 0;
  }

  async count(where?: SQL<unknown>): Promise<number> {
    const rows = await this.db.select({ value: count() }).from(this.table).where(where);
    return rows[0]?.value ?? 0;
  }

  async exists(where: SQL<unknown>): Promise<boolean> {
    const rows = await this.db
      .select({ id: this.idColumn })
      .from(this.table)
      .where(where)
      .limit(1);
    return rows.length > 0;
  }

  /**
   * Escape hatch: run `fn` inside a transaction. Prefer injecting
   * `DrizzleService` directly for transactional work.
   */
  protected async inTransaction<T>(fn: (tx: DrizzleDb) => Promise<T>): Promise<T> {
    return this.db.transaction(fn as any) as Promise<T>;
  }
}

export { and };