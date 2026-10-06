import { ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, asc, count, desc, eq, gte, ilike, isNull, or } from 'drizzle-orm';
import type { AnyPgColumn } from 'drizzle-orm/pg-core';

import { PaginationDto } from '../../common/dto/pagination.dto';
import { DRIZZLE, type DrizzleDb } from '../../common/drizzle/drizzle.module';
import { newId } from '../../common/drizzle/id';
import { notices, type NewNoticeRow, type NoticeRow } from '../../common/drizzle/schema';

const SORTABLE: Record<string, AnyPgColumn> = {
  title: notices.title,
  publishedAt: notices.publishedAt,
  category: notices.category,
  priority: notices.priority,
  createdAt: notices.createdAt,
  updatedAt: notices.updatedAt,
};

export interface NoticeFilters {
  category?: string;
  priority?: string;
  isPublished?: boolean;
  language?: string;
  search?: string;
}

const STAFF_ROLES = new Set(['ADMIN', 'STAFF']);

@Injectable()
export class NoticesService {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDb) {}

  /** Admin listing — every notice regardless of publication state. */
  async findAll(pagination: PaginationDto, filters: NoticeFilters = {}) {
    const page = pagination.page ?? 1;
    const limit = pagination.limit ?? 10;
    const orderBy = this.orderBy(pagination);

    const where = this.buildWhere(filters);

    const [rows, totals] = await Promise.all([
      this.db.select().from(notices).where(where).orderBy(orderBy).limit(limit).offset((page - 1) * limit),
      this.db.select({ value: count() }).from(notices).where(where),
    ]);

    const total = totals[0]?.value ?? 0;
    return { data: rows, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  /**
   * Public notice board: published notices that have not expired.
   * GIGW 3.0 requires current notices to be reachable without login, so this is
   * the endpoint the homepage uses.
   */
  async findPublished(pagination: PaginationDto, language?: string) {
    const page = pagination.page ?? 1;
    const limit = pagination.limit ?? 10;
    const orderBy = this.orderBy(pagination);

    const where = and(
      eq(notices.isPublished, true),
      or(isNull(notices.expiresAt), gte(notices.expiresAt, new Date())),
      ...(language ? [eq(notices.language, language)] : []),
    );

    const [rows, totals] = await Promise.all([
      this.db.select().from(notices).where(where).orderBy(orderBy).limit(limit).offset((page - 1) * limit),
      this.db.select({ value: count() }).from(notices).where(where),
    ]);

    const total = totals[0]?.value ?? 0;
    return { data: rows, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async findById(id: string): Promise<NoticeRow> {
    const [notice] = await this.db.select().from(notices).where(eq(notices.id, id)).limit(1);
    if (!notice) throw new NotFoundException('Notice not found');
    return notice;
  }

  async create(data: Partial<NewNoticeRow>, userId: string): Promise<NoticeRow> {
    const [created] = await this.db
      .insert(notices)
      .values({
        ...data,
        id: data.id ?? newId(),
        authorId: data.authorId ?? userId,
        // Publishing and stamping the timestamp happen together so the public
        // board ordering can never show an un-dated notice.
        publishedAt: data.isPublished ? (data.publishedAt ?? new Date()) : data.publishedAt ?? null,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as NewNoticeRow)
      .returning();

    return created;
  }

  async update(
    id: string,
    data: Partial<NewNoticeRow>,
    userId: string,
    userRole: string,
  ): Promise<NoticeRow> {
    if (!STAFF_ROLES.has(userRole)) {
      throw new ForbiddenException('Not authorized to update notices');
    }

    const current = await this.findById(id);
    const next: Partial<NewNoticeRow> = { ...data, updatedAt: new Date() };

    if (data.isPublished === true && !current.isPublished) {
      next.publishedAt = new Date();
    } else if (data.isPublished === false) {
      next.publishedAt = null;
    }

    const [updated] = await this.db.update(notices).set(next).where(eq(notices.id, id)).returning();
    return updated;
  }

  async delete(id: string, userId: string, userRole: string): Promise<{ success: true }> {
    if (!STAFF_ROLES.has(userRole)) {
      throw new ForbiddenException('Not authorized to delete notices');
    }

    await this.findById(id);
    await this.db.delete(notices).where(eq(notices.id, id));
    return { success: true };
  }

  async getCategories(): Promise<string[]> {
    return ['GENERAL', 'RECRUITMENT', 'TENDER', 'PUBLIC_HEALTH', 'SCHEDULE_CHANGE', 'EMERGENCY'];
  }

  async getPriorities(): Promise<string[]> {
    return ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
  }

  private buildWhere(filters: NoticeFilters) {
    const conditions = [];

    if (filters.category) conditions.push(eq(notices.category, filters.category as never));
    if (filters.priority) conditions.push(eq(notices.priority, filters.priority as never));
    if (filters.isPublished !== undefined) conditions.push(eq(notices.isPublished, filters.isPublished));
    if (filters.language) conditions.push(eq(notices.language, filters.language));
    if (filters.search) {
      const pattern = `%${filters.search}%`;
      conditions.push(or(ilike(notices.title, pattern), ilike(notices.content, pattern)));
    }

    return conditions.length > 0 ? and(...conditions) : undefined;
  }

  private orderBy(pagination: PaginationDto) {
    const column = SORTABLE[pagination.sortBy ?? 'publishedAt'] ?? notices.publishedAt;
    return pagination.sortOrder === 'asc' ? asc(column) : desc(column);
  }
}