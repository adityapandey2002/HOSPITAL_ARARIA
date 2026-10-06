// Base Drizzle Repository - Generic base repository with common CRUD, pagination, filtering patterns
import { Injectable, Inject } from '@nestjs/common';
import { DrizzleDb, DRIZZLE_TOKEN } from '../drizzle/drizzle.module';
import { SQL, sql, and, or, eq, ne, gt, gte, lt, lte, like, ilike, inArray, desc, asc, count } from 'drizzle-orm';
import { AnyPgTable, AnyPgColumn } from 'drizzle-orm/pg-core';

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResult<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface FilterCondition {
  field: string;
  operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'like' | 'ilike' | 'in';
  value: any;
}

export abstract class BaseDrizzleRepository<TTable extends AnyPgTable, TSelect, TInsert> {
  protected abstract table: TTable;
  protected abstract idColumn: AnyPgColumn;

  constructor(
    @Inject(DRIZZLE_TOKEN) protected readonly db: DrizzleDb,
  ) {}

  /**
   * Find by ID
   */
  async findById(id: string): Promise<TSelect | null> {
    const result = await this.db
      .select()
      .from(this.table)
      .where(eq(this.idColumn, id))
      .limit(1);
    return result[0] || null;
  }

  /**
   * Find all with pagination, sorting, and filtering
   */
  async findAll(
    pagination: PaginationParams = {},
    filters: FilterCondition[] = [],
    extraWhere?: SQL<unknown>
  ): Promise<PaginatedResult<TSelect>> {
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = pagination;
    const offset = (page - 1) * limit;

    // Build where conditions
    const conditions: SQL<unknown>[] = [];

    for (const filter of filters) {
      const column = this.table[filter.field as keyof TTable] as AnyPgColumn;
      if (!column) continue;

      switch (filter.operator) {
        case 'eq':
          conditions.push(eq(column, filter.value));
          break;
        case 'ne':
          conditions.push(ne(column, filter.value));
          break;
        case 'gt':
          conditions.push(gt(column, filter.value));
          break;
        case 'gte':
          conditions.push(gte(column, filter.value));
          break;
        case 'lt':
          conditions.push(lt(column, filter.value));
          break;
        case 'lte':
          conditions.push(lte(column, filter.value));
          break;
        case 'like':
          conditions.push(like(column, `%${filter.value}%`));
          break;
        case 'ilike':
          conditions.push(ilike(column, `%${filter.value}%`));
          break;
        case 'in':
          conditions.push(inArray(column, filter.value));
          break;
      }
    }

    if (extraWhere) {
      conditions.push(extraWhere);
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Build order by
    const sortColumn = this.table[sortBy as keyof TTable] as AnyPgColumn;
    const orderBy = sortOrder === 'asc' ? asc(sortColumn) : desc(sortColumn);

    // Execute queries
    const [data, totalResult] = await Promise.all([
      this.db
        .select()
        .from(this.table)
        .where(whereClause)
        .orderBy(orderBy)
        .limit(limit)
        .offset(offset),
      this.db
        .select({ count: count() })
        .from(this.table)
        .where(whereClause),
    ]);

    const total = totalResult[0]?.count || 0;

    return {
      data: data as TSelect[],
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Find one by arbitrary where condition
   */
  async findOne(where: SQL<unknown>): Promise<TSelect | null> {
    const result = await this.db
      .select()
      .from(this.table)
      .where(where)
      .limit(1);
    return result[0] || null;
  }

  /**
   * Create new record
   */
  async create(data: TInsert): Promise<TSelect> {
    const result = await this.db
      .insert(this.table)
      .values(data)
      .returning();
    return result[0] as TSelect;
  }

  /**
   * Create multiple records
   */
  async createMany(data: TInsert[]): Promise<TSelect[]> {
    if (data.length === 0) return [];
    const result = await this.db
      .insert(this.table)
      .values(data)
      .returning();
    return result as TSelect[];
  }

  /**
   * Update by ID
   */
  async update(id: string, data: Partial<TInsert>): Promise<TSelect | null> {
    const result = await this.db
      .update(this.table)
      .set(data)
      .where(eq(this.idColumn, id))
      .returning();
    return result[0] || null;
  }

  /**
   * Delete by ID
   */
  async delete(id: string): Promise<boolean> {
    const result = await this.db
      .delete(this.table)
      .where(eq(this.idColumn, id));
    return (result.rowCount ?? 0) > 0;
  }

  /**
   * Execute transaction
   */
  async transaction<T>(fn: (tx: any) => Promise<T>): Promise<T> {
    // This will be implemented by the concrete service with access to DrizzleService
    throw new Error('Transaction must be called via DrizzleService.transaction()');
  }

  /**
   * Count total records
   */
  async count(where?: SQL<unknown>): Promise<number> {
    const result = await this.db
      .select({ count: count() })
      .from(this.table)
      .where(where);
    return result[0]?.count || 0;
  }

  /**
   * Check if record exists
   */
  async exists(where: SQL<unknown>): Promise<boolean> {
    const result = await this.db
      .select({ id: this.idColumn })
      .from(this.table)
      .where(where)
      .limit(1);
    return result.length > 0;
  }
}