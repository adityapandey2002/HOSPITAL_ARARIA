import { ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, asc, count, desc, eq } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';

import { PaginationDto } from '../../common/dto/pagination.dto';
import { DRIZZLE, type DrizzleDb } from '../../common/drizzle/drizzle.module';
import { newId } from '../../common/drizzle/id';
import {
  grievances,
  users,
  type GrievanceRow,
  type NewGrievanceRow,
} from '../../common/drizzle/schema';

export interface GrievanceFilters {
  userId?: string;
  status?: string;
  category?: string;
  assignedTo?: string;
}

const STAFF_ROLES = new Set(['ADMIN', 'STAFF']);

type Select = typeof grievances.$inferSelect;
type Insert = typeof grievances.$inferInsert;

@Injectable()
export class GrievancesService {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDb) {}

  async findAll(pagination: PaginationDto, filters: GrievanceFilters = {}) {
    const page = pagination.page ?? 1;
    const limit = pagination.limit ?? 10;
    const offset = (page - 1) * limit;

    const conditions = [];
    if (filters.userId) conditions.push(eq(grievances.userId, filters.userId));
    if (filters.status) conditions.push(eq(grievances.status, filters.status as Select['status']));
    if (filters.category) conditions.push(eq(grievances.category, filters.category as Select['category']));
    if (filters.assignedTo) conditions.push(eq(grievances.assignedTo, filters.assignedTo));

    const where = conditions.length > 0 ? and(...conditions) : undefined;
    const sortColumn = pagination.sortBy === 'status' ? grievances.status : grievances.createdAt;
    const orderBy = pagination.sortOrder === 'asc' ? asc(sortColumn) : desc(sortColumn);

    // Two joins onto the same table, so the assignee needs an alias.
    const author = alias(users, 'author');
    const assignee = alias(users, 'assignee');

    const projection = {
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
      user: { id: author.id, name: author.name, email: author.email, phone: author.phone },
      assignee: { id: assignee.id, name: assignee.name, email: assignee.email },
    };

    const [rows, totals] = await Promise.all([
      this.db
        .select(projection)
        .from(grievances)
        .leftJoin(author, eq(grievances.userId, author.id))
        .leftJoin(assignee, eq(grievances.assignedTo, assignee.id))
        .where(where)
        .orderBy(orderBy)
        .limit(limit)
        .offset(offset),
      this.db.select({ value: count() }).from(grievances).where(where),
    ]);

    const total = totals[0]?.value ?? 0;
    return { data: rows, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async findById(id: string) {
    const author = alias(users, 'author');
    const assignee = alias(users, 'assignee');

    const [row] = await this.db
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
        user: { id: author.id, name: author.name, email: author.email, phone: author.phone },
        assignee: { id: assignee.id, name: assignee.name, email: assignee.email },
      })
      .from(grievances)
      .leftJoin(author, eq(grievances.userId, author.id))
      .leftJoin(assignee, eq(grievances.assignedTo, assignee.id))
      .where(eq(grievances.id, id))
      .limit(1);

    if (!row) throw new NotFoundException('Grievance not found');
    return row;
  }

  /** Public CPGRAMS-style submission — works with or without a logged-in user. */
  async create(data: Partial<Insert>, userId?: string): Promise<GrievanceRow> {
    const [created] = await this.db
      .insert(grievances)
      .values({
        ...data,
        id: data.id ?? newId(),
        userId: data.userId ?? userId,
        status: 'SUBMITTED',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as Insert)
      .returning();

    return created;
  }

  async update(id: string, data: Partial<Insert>, userId: string, userRole: string) {
    const grievance = await this.findById(id);

    if (!STAFF_ROLES.has(userRole) && grievance.userId !== userId) {
      throw new ForbiddenException('Not authorized to update this grievance');
    }

    const [updated] = await this.db
      .update(grievances)
      .set({ ...data, updatedAt: new Date() } as Partial<Insert>)
      .where(eq(grievances.id, id))
      .returning();

    return updated;
  }

  async updateStatus(
    id: string,
    status: Insert['status'],
    userId: string,
    userRole: string,
    resolution?: string,
  ) {
    if (!STAFF_ROLES.has(userRole)) {
      throw new ForbiddenException('Not authorized to update status');
    }

    await this.findById(id);

    const [updated] = await this.db
      .update(grievances)
      .set({
        status,
        resolution,
        // Taking ownership is implicit in any status transition.
        assignedTo: userId,
        updatedAt: new Date(),
      } as Partial<Insert>)
      .where(eq(grievances.id, id))
      .returning();

    return updated;
  }

  async assign(id: string, assigneeId: string, userId: string, userRole: string) {
    if (!STAFF_ROLES.has(userRole)) {
      throw new ForbiddenException('Not authorized to assign grievances');
    }

    const [updated] = await this.db
      .update(grievances)
      .set({ assignedTo: assigneeId, status: 'IN_PROGRESS', updatedAt: new Date() } as Partial<Insert>)
      .where(eq(grievances.id, id))
      .returning();

    return updated;
  }

  async delete(id: string, userId: string, userRole: string): Promise<{ success: true }> {
    const grievance = await this.findById(id);

    // Admins may remove any grievance; citizens may withdraw their own.
    if (userRole !== 'ADMIN' && grievance.userId !== userId) {
      throw new ForbiddenException('Not authorized to delete this grievance');
    }

    await this.db.delete(grievances).where(eq(grievances.id, id));
    return { success: true };
  }

  async getMyGrievances(userId: string, pagination: PaginationDto) {
    return this.findAll(pagination, { userId });
  }

  async getCategories(): Promise<readonly string[]> {
    return [
      'MEDICAL_NEGLIGENCE',
      'STAFF_BEHAVIOR',
      'INFRASTRUCTURE',
      'BILLING',
      'APPOINTMENT',
      'MEDICINE_AVAILABILITY',
      'CLEANLINESS',
      'OTHER',
    ];
  }

  async getStatuses(): Promise<readonly string[]> {
    return ['SUBMITTED', 'UNDER_REVIEW', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'REJECTED'];
  }
}