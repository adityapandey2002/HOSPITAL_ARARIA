// MikroORM Repository Base - Generic base repository for MikroORM entities
import { Injectable, Inject } from '@nestjs/common';
import { EntityManager, EntityRepository, FilterQuery, FindOptions, QueryOrder } from '@mikro-orm/core';
import { ENTITY_MANAGER_TOKEN, MIKRO_ORM_TOKEN } from '../mikro.module';

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

@Injectable()
export abstract class BaseMikroRepository<T> {
  protected abstract entityName: string;

  constructor(
    @Inject(ENTITY_MANAGER_TOKEN) protected readonly em: EntityManager,
    @Inject(MIKRO_ORM_TOKEN) protected readonly orm: any,
  ) {}

  protected getRepo(): EntityRepository<any> {
    return this.em.getRepository(this.entityName);
  }

  async findById(id: string): Promise<any | null> {
    return this.getRepo().findOne({ id });
  }

  async findAll(
    pagination: PaginationParams = {},
    filters: { field: string; operator: string; value: any }[] = [],
    extraWhere?: Record<string, any>
  ): Promise<{ data: any[]; meta: { page: number; limit: number; total: number; totalPages: number } }> {
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = pagination;
    const offset = (page - 1) * limit;

    const where: Record<string, any> = {};

    // Build filters
    // This is simplified - in production, use FilterQuery for complex queries
    Object.assign(where, ...filters);

    const [data, total] = await Promise.all([
      this.getRepo().find(
        {},
        {
          limit,
          offset,
          orderBy: { [sortBy]: sortOrder },
        },
      ),
      this.getRepo().count(),
    );

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(where: Record<string, any>): Promise<any | null> {
    return this.getRepo().findOne(where);
  }

  async find(where: Record<string, any>, options?: FindOptions<any>): Promise<any[]> {
    return this.getRepo().find(where, options);
  }

  async create(data: any): Promise<any> {
    const entity = this.em.create(this.entityName, data);
    await this.em.persistAndFlush(entity);
    return entity;
  }

  async createMany(data: any[]): Promise<any[]> {
    if (data.length === 0) return [];
    const entities = data.map(d => this.em.create(this.entityName, d));
    await this.em.persistAndFlush(entities);
    return entities;
  }

  async update(id: string, data: any): Promise<any | null> {
    const entity = await this.getRepo().findOne({ id });
    if (!entity) return null;

    Object.assign(entity, data);
    await this.em.persistAndFlush(entity);
    return entity;
  }

  async delete(id: string): Promise<boolean> {
    const entity = await this.getRepo().findOne({ id });
    if (!entity) return false;

    await this.em.removeAndFlush(entity);
    return true;
  }

  async transaction<T>(fn: (em: EntityManager) => Promise<T>): Promise<T> {
    return this.em.transactional(fn);
  }

  async count(where?: Record<string, any>): Promise<number> {
    return this.getRepo().count(where);
  }

  async exists(where: Record<string, any>): Promise<boolean> {
    const count = await this.getRepo().count(where);
    return count > 0;
  }
}