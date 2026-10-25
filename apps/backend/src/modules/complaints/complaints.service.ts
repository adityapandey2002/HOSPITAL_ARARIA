import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, count, desc, eq, isNotNull } from 'drizzle-orm';
import { ComplaintStatus, UserRole, isStaffRole } from '@dh-araria/shared';

import { PaginationDto } from '../../common/dto/pagination.dto';
import { DRIZZLE, type DrizzleDb } from '../../common/drizzle/drizzle.module';
import { newId } from '../../common/drizzle/id';
import {
  departments,
  grievances,
  type GrievanceRow,
  type NewGrievanceRow,
} from '../../common/drizzle/schema';

import type { CreateComplaintDto, ComplaintQueryDto, UpdateComplaintStatusDto } from './dto/complaint.dto';

export interface ComplaintWithDetails extends GrievanceRow {
  departmentName?: string | null;
}

type Select = typeof grievances.$inferSelect;
type Insert = typeof grievances.$inferInsert;

/**
 * Owns public complaint submission and admin-side complaint tracking.
 *
 * Complaints are stored in the same `grievances` table as CPGRAMS grievances,
 * but are distinguished by a non-null `complaintStatus`. The public submission
 * surface is simpler than the grievance form: no email/phone required, and an
 * image URL (from the camera option) may be attached.
 */
@Injectable()
export class ComplaintsService {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDb) {}

  // -------------------------------------------------------------------------
  // Public write
  // -------------------------------------------------------------------------

  async create(dto: CreateComplaintDto): Promise<GrievanceRow> {
    const [department] = await this.db
      .select({ id: departments.id, name: departments.name, isActive: departments.isActive })
      .from(departments)
      .where(eq(departments.id, dto.departmentId))
      .limit(1);

    if (!department || !department.isActive) {
      throw new NotFoundException('Department not found');
    }

    const now = new Date();
    const values: NewGrievanceRow = {
      id: newId(),
      name: dto.name,
      email: '',
      phone: '',
      departmentId: dto.departmentId,
      category: 'OTHER',
      subject: `Complaint - ${department.name}`,
      description: dto.complaint,
      status: 'SUBMITTED',
      complaintStatus: ComplaintStatus.SUBMITTED,
      imageUrl: dto.imageUrl ?? null,
      createdAt: now,
      updatedAt: now,
    } as Insert;

    const [created] = await this.db.insert(grievances).values(values).returning();
    return created;
  }

  // -------------------------------------------------------------------------
  // Admin reads
  // -------------------------------------------------------------------------

  async findAll(pagination: PaginationDto, filters: ComplaintQueryDto) {
    const page = pagination.page ?? 1;
    const limit = pagination.limit ?? 10;
    const offset = (page - 1) * limit;

    const conditions = [
      // Only surface rows submitted through the simple complaint form.
      isNotNull(grievances.complaintStatus),
    ];
    if (filters.departmentId) {
      conditions.push(eq(grievances.departmentId, filters.departmentId));
    }
    if (filters.status) {
      conditions.push(
        eq(grievances.complaintStatus, filters.status as NonNullable<Select['complaintStatus']>)
      );
    }
    if (filters.assignedTo) {
      conditions.push(eq(grievances.assignedTo, filters.assignedTo));
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined;
    const orderBy = desc(grievances.createdAt);

    const [rows, totals] = await Promise.all([
      this.db
        .select({
          id: grievances.id,
          userId: grievances.userId,
          name: grievances.name,
          email: grievances.email,
          phone: grievances.phone,
          departmentId: grievances.departmentId,
          category: grievances.category,
          subject: grievances.subject,
          description: grievances.description,
          status: grievances.status,
          complaintStatus: grievances.complaintStatus,
          imageUrl: grievances.imageUrl,
          cpgramsId: grievances.cpgramsId,
          assignedTo: grievances.assignedTo,
          resolution: grievances.resolution,
          createdAt: grievances.createdAt,
          updatedAt: grievances.updatedAt,
          departmentName: departments.name,
        })
        .from(grievances)
        .leftJoin(departments, eq(grievances.departmentId, departments.id))
        .where(where)
        .orderBy(orderBy)
        .limit(limit)
        .offset(offset),
      this.db.select({ value: count() }).from(grievances).where(where),
    ]);

    const total = totals[0]?.value ?? 0;
    return {
      data: rows,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async findById(id: string): Promise<ComplaintWithDetails> {
    const [row] = await this.db
      .select({
        id: grievances.id,
        userId: grievances.userId,
        name: grievances.name,
        email: grievances.email,
        phone: grievances.phone,
        departmentId: grievances.departmentId,
        category: grievances.category,
        subject: grievances.subject,
        description: grievances.description,
        status: grievances.status,
        complaintStatus: grievances.complaintStatus,
        imageUrl: grievances.imageUrl,
        cpgramsId: grievances.cpgramsId,
        assignedTo: grievances.assignedTo,
        resolution: grievances.resolution,
        createdAt: grievances.createdAt,
        updatedAt: grievances.updatedAt,
        departmentName: departments.name,
      })
      .from(grievances)
      .leftJoin(departments, eq(grievances.departmentId, departments.id))
      .where(eq(grievances.id, id))
      .limit(1);

    if (!row) throw new NotFoundException('Complaint not found');
    return row;
  }

  // -------------------------------------------------------------------------
  // Admin status workflow
  // -------------------------------------------------------------------------

  async updateStatus(
    id: string,
    status: ComplaintStatus,
    userId: string,
    userRole: string,
    resolution?: string
  ): Promise<GrievanceRow> {
    if (!isStaffRole(userRole)) {
      throw new ForbiddenException('Not authorized to update complaint status');
    }

    await this.findById(id);

    const [updated] = await this.db
      .update(grievances)
      .set({
        complaintStatus: status,
        status:
          status === ComplaintStatus.RESOLVED || status === ComplaintStatus.CLOSED
            ? 'RESOLVED'
            : status,
        resolution,
        assignedTo: userId,
        updatedAt: new Date(),
      } as Partial<Insert>)
      .where(eq(grievances.id, id))
      .returning();

    return updated;
  }

  async getStats() {
    const total = await this.db
      .select({ value: count() })
      .from(grievances)
      .where(isNotNull(grievances.complaintStatus));

    const byStatus = await this.db
      .select({ status: grievances.complaintStatus, value: count() })
      .from(grievances)
      .where(isNotNull(grievances.complaintStatus))
      .groupBy(grievances.complaintStatus);

    const stats: Record<ComplaintStatus, number> = {
      SUBMITTED: 0,
      UNDER_REVIEW: 0,
      IN_PROGRESS: 0,
      RESOLVED: 0,
      CLOSED: 0,
      REJECTED: 0,
    };

    for (const row of byStatus) {
      stats[row.status as ComplaintStatus] = Number(row.value);
    }

    return {
      total: Number(total[0]?.value ?? 0),
      byStatus: stats,
    };
  }
}
