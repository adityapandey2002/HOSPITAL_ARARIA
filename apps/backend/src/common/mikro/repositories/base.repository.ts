/**
 * BaseMikroRepository
 * ------------------
 * Generic CRUD/pagination helper for clinical & ABDM entities.
 *
 * Deliberately thin: anything touching health data should own its Unit of Work
 * explicitly (`this.em.transactional(...)`) rather than rely on implicit
 * flushes, so subclasses drive `em` themselves. MikroORM's `RequiredEntityData`
 * generics are bypassed with a narrow cast — the entities are ours, so the only
 * benefit of the stricter type would be fighting the compiler.
 */
import { Inject } from '@nestjs/common';
import { EntityManager, EntityRepository, FindOptions, FilterQuery } from '@mikro-orm/core';

import { ENTITY_MANAGER, MIKRO_ORM } from '../mikro.module';

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

export abstract class BaseMikroRepository<T extends object> {
  /** Concrete entity class, supplied by the subclass. */
  protected abstract readonly entity: new () => T;

  constructor(
    @Inject(ENTITY_MANAGER) protected readonly em: EntityManager,
    @Inject(MIKRO_ORM) protected readonly orm: any,
  ) {}

  protected repo(): EntityRepository<T> {
    return this.em.getRepository(this.entity as any) as EntityRepository<T>;
  }

  async findById(id: string): Promise<T | null> {
    return this.repo().findOne({ id } as FilterQuery<T>);
  }

  async findOne(where: FilterQuery<T>): Promise<T | null> {
    return this.repo().findOne(where);
  }

  async findMany(where: FilterQuery<T> = {} as FilterQuery<T>, options?: FindOptions<T>): Promise<T[]> {
    return this.repo().find(where, options);
  }

  async findAll(
    pagination: PaginationParams = {},
    where: FilterQuery<T> = {} as FilterQuery<T>,
  ): Promise<PaginatedResult<T>> {
    const page = Math.max(1, pagination.page ?? 1);
    const limit = Math.min(100, Math.max(1, pagination.limit ?? 20));
    const offset = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.repo().find(where, {
        limit,
        offset,
        orderBy: {
          [pagination.sortBy ?? 'createdAt']: pagination.sortOrder ?? 'desc',
        } as FindOptions<T>['orderBy'],
      }),
      this.repo().count(where),
    ]);

    return {
      data,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async create(data: Partial<T>): Promise<T> {
    const entity = this.em.create(this.entity as any, data as any) as T;
    await this.em.persistAndFlush(entity);
    return entity;
  }

  async update(id: string, data: Partial<T>): Promise<T | null> {
    const entity = await this.repo().findOne({ id } as FilterQuery<T>);
    if (!entity) return null;

    this.em.assign(entity as any, data as any);
    await this.em.flush();
    return entity;
  }

  async delete(id: string): Promise<boolean> {
    const entity = await this.repo().findOne({ id } as FilterQuery<T>);
    if (!entity) return false;

    await this.em.removeAndFlush(entity);
    return true;
  }

  async count(where: FilterQuery<T> = {} as FilterQuery<T>): Promise<number> {
    return this.repo().count(where);
  }

  async exists(where: FilterQuery<T>): Promise<boolean> {
    return (await this.repo().count(where)) > 0;
  }

  /**
   * Run `fn` in a Unit of Work that commits or rolls back atomically. Every
   * ABDM write path goes through here so the clinical record, its consent
   * artefact and the audit rows land together.
   */
  async transaction<TResult>(fn: (em: EntityManager) => Promise<TResult>): Promise<TResult> {
    return this.em.transactional(fn);
  }
}