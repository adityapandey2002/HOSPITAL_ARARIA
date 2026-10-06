import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { NoticeCategory, NoticePriority } from '@dh-araria/shared/types';
import { notices } from '../../common/drizzle/schema';
import { eq, and, or, desc, asc, sql, count, gte, isNull, ilike } from 'drizzle-orm';

@Injectable()
export class NoticesService {
  constructor(
    @Inject('DRIZZLE') private db: any,
  ) {}

  async findAll(pagination: any, filters?: any) {
    const { page = 1, limit = 10, sortBy = 'publishedAt', sortOrder = 'desc' } = pagination;
    const offset = (page - 1) * limit;

    const conditions: any[] = [];

    if (filters?.category) conditions.push(eq(notices.category, filters.category));
    if (filters?.priority) conditions.push(eq(notices.priority, filters.priority));
    if (filters?.isPublished !== undefined) conditions.push(eq(notices.isPublished, filters.isPublished));
    if (filters?.language) conditions.push(eq(notices.language, filters.language));
    if (filters?.search) {
      conditions.push(
        or(
          ilike(notices.title, `%${filters.search}%`),
          ilike(notices.content, `%${filters.search}%`)
        )
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const sortColumn = notices[sortBy as keyof typeof notices];
    const orderBy = sortOrder === 'asc' ? asc(sortColumn) : desc(sortColumn);

    const [noticesData, totalResult] = await Promise.all([
      this.db
        .select()
        .from(notices)
        .where(whereClause)
        .orderBy(sortOrder === 'asc' ? asc(notices[sortBy as keyof typeof notices]) : desc(notices[sortBy as keyof typeof notices]))
        .limit(limit)
        .offset((page - 1) * limit),
      this.db
        .select({ count: count() })
        .from(notices)
        .where(whereClause),
    ]);

    const total = totalResult[0]?.count || 0;

    return {
      data: noticesData,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async findPublished(pagination: any, language?: string) {
    const { page = 1, limit = 10, sortBy = 'publishedAt', sortOrder = 'desc' } = pagination;
    const offset = (page - 1) * limit;

    const conditions = [
      eq(notices.isPublished, true),
      or(isNull(notices.expiresAt), gte(notices.expiresAt, new Date())),
    ];

    if (language) {
      conditions.push(eq(notices.language, language));
    }

    const [noticesData, totalResult] = await Promise.all([
      this.db
        .select()
        .from(notices)
        .where(and(...conditions))
        .orderBy(sortOrder === 'asc' ? asc(notices[sortBy as keyof typeof notices]) : desc(notices[sortBy as keyof typeof notices]))
        .limit(limit)
        .offset(offset),
      this.db
        .select({ count: count() })
        .from(notices)
        .where(and(...conditions)),
    ]);

    const total = totalResult[0]?.count || 0;

    return {
      data: noticesData,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async findById(id: string) {
    const result = await this.db
      .select()
      .from(notices)
      .where(eq(notices.id, id))
      .limit(1);

    if (!result[0]) throw new Error('Notice not found');
    return result[0];
  }

  async create(data: any, userId: string) {
    const insertData = {
      ...data,
      publishedAt: data.isPublished ? new Date() : null,
      authorId: userId,
    };

    const result = await this.db
      .insert(notices)
      .values(insertData)
      .returning();

    return result[0];
  }

  async update(id: string, data: any, userId: string, userRole: string) {
    await this.findById(id);

    if (userRole !== 'ADMIN' && userRole !== 'STAFF') {
      throw new ForbiddenException('Not authorized to update notices');
    }

    const updateData: any = { ...data };
    if (data.isPublished !== undefined) {
      if (data.isPublished) {
        updateData.publishedAt = new Date();
      } else {
        updateData.publishedAt = null;
      }
    }

    const result = await this.db
      .update(notices)
      .set(updateData)
      .where(eq(notices.id, id))
      .returning();

    return result[0];
  }

  async delete(id: string, userId: string, userRole: string) {
    if (userRole !== 'ADMIN' && userRole !== 'STAFF') {
      throw new ForbiddenException('Not authorized to delete notices');
    }
    await this.findById(id);
    await this.db.delete(notices).where(eq(notices.id, id));
    return { success: true };
  }

  async getCategories() {
    return Object.values(NoticeCategory);
  }

  async getPriorities() {
    return Object.values(NoticePriority);
  }
}