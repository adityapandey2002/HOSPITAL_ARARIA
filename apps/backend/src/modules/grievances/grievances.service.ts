import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { GrievanceStatus, GrievanceCategory } from '@dh-araria/shared/types';
import { grievances, users } from '../../common/drizzle/schema';
import { eq, and, desc, asc, sql, count, ilike } from 'drizzle-orm';

@Injectable()
export class GrievancesService {
  constructor(
    @Inject('DRIZZLE') private db: any,
  ) {}

  async findAll(pagination: any, filters?: any) {
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = pagination;
    const offset = (page - 1) * limit;

    const conditions: any[] = [];

    if (filters?.userId) conditions.push(eq(grievances.userId, filters.userId));
    if (filters?.status) conditions.push(eq(grievances.status, filters.status));
    if (filters?.category) conditions.push(eq(grievances.category, filters.category));
    if (filters?.assignedTo) conditions.push(eq(grievances.assignedTo, filters.assignedTo));

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const sortColumn = grievances[sortBy as keyof typeof grievances];
    const orderBy = sortOrder === 'asc' ? asc(sortColumn) : desc(sortColumn);

    const [grievancesData, totalResult] = await Promise.all([
      this.db
        .select({
          id: grievances.id,
          userId: grievances.userId,
          name: grievances.name,
          email: grievances.email,
          phone: grievances.phone,
          category: grievances.category,
          subject: grievances.subject,
          description: grievances.description,
          status: grievances.status,
          cpgramsId: grievances.cpgramsId,
          assignedTo: grievances.assignedTo,
          resolution: grievances.resolution,
          createdAt: grievances.createdAt,
          updatedAt: grievances.updatedAt,
          user: {
            id: users.id,
            name: users.name,
            email: users.email,
            phone: users.phone,
          },
          assignee: {
            id: users.id,
            name: users.name,
            email: users.email,
          },
        })
        .from(grievances)
        .leftJoin(users, eq(grievances.userId, users.id))
        .leftJoin(users, eq(grievances.assignedTo, users.id))
        .where(whereClause)
        .orderBy(sortOrder === 'asc' ? asc(sortColumn) : desc(sortColumn))
        .limit(limit)
        .offset(offset),
      this.db
        .select({ count: count() })
        .from(grievances)
        .where(whereClause),
    ]);

    const total = totalResult[0]?.count || 0;

    return {
      data: grievancesData,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async findById(id: string) {
    const result = await this.db
      .select({
        id: grievances.id,
        userId: grievances.userId,
        name: grievances.name,
        email: grievances.email,
        phone: grievances.phone,
        category: grievances.category,
        subject: grievances.subject,
        description: grievances.description,
        status: grievances.status,
        cpgramsId: grievances.cpgramsId,
        assignedTo: grievances.assignedTo,
        resolution: grievances.resolution,
        createdAt: grievances.createdAt,
        updatedAt: grievances.updatedAt,
        user: {
          id: users.id,
          name: users.name,
          email: users.email,
          phone: users.phone,
        },
        assignee: {
          id: users.id,
          name: users.name,
          email: users.email,
        },
      })
      .from(grievances)
      .leftJoin(users, eq(grievances.userId, users.id))
      .leftJoin(users, eq(grievances.assignedTo, users.id))
      .where(eq(grievances.id, id))
      .limit(1);

    if (!result[0]) throw new Error('Grievance not found');
    return result[0];
  }

  async create(data: any, userId?: string) {
    const result = await this.db
      .insert(grievances)
      .values({
        userId,
        name: data.name,
        email: data.email,
        phone: data.phone,
        category: data.category,
        subject: data.subject,
        description: data.description,
        status: 'SUBMITTED',
      })
      .returning();

    return result[0];
  }

  async update(id: string, data: any, userId: string, userRole: string) {
    const grievance = await this.findById(id);

    if (userRole !== 'ADMIN' && userRole !== 'STAFF' && grievance.userId !== userId) {
      throw new Error('Not authorized to update this grievance');
    }

    const result = await this.db
      .update(grievances)
      .set(data)
      .where(eq(grievances.id, id))
      .returning();

    return result[0];
  }

  async updateStatus(id: string, status: string, userId: string, userRole: string, resolution?: string) {
    const grievance = await this.findById(id);

    if (userRole !== 'ADMIN' && userRole !== 'STAFF') {
      throw new Error('Not authorized to update status');
    }

    const updateData: any = { status };
    if (resolution) {
      updateData.resolution = resolution;
    }
    updateData.assignedTo = userId;

    const result = await this.db
      .update(grievances)
      .set(updateData)
      .where(eq(grievances.id, id))
      .returning();

    return result[0];
  }

  async assign(id: string, assigneeId: string, userId: string, userRole: string) {
    if (userRole !== 'ADMIN' && userRole !== 'STAFF') {
      throw new Error('Not authorized to assign grievances');
    }

    const result = await this.db
      .update(grievances)
      .set({ assignedTo: assigneeId, status: 'IN_PROGRESS' })
      .where(eq(grievances.id, id))
      .returning();

    return result[0];
  }

  async delete(id: string, userId: string, userRole: string) {
    const grievance = await this.findById(id);
    if (userRole !== 'ADMIN' && grievance.userId !== userId) {
      throw new Error('Not authorized to delete this grievance');
    }
    await this.db.delete(grievances).where(eq(grievances.id, id));
    return { success: true };
  }

  async getMyGrievances(userId: string, pagination: any) {
    return this.findAll(pagination, { userId });
  }

  async getCategories() {
    return Object.values(GrievanceCategory);
  }

  async getStatuses() {
    return Object.values(GrievanceStatus);
  }
}