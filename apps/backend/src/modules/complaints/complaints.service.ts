import {
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { and, count, desc, eq, inArray, isNotNull, sql } from 'drizzle-orm';
import { ComplaintStatus, UserRole, isStaffRole } from '@dh-araria/shared';

import { PaginationDto } from '../../common/dto/pagination.dto';
import { DRIZZLE, type DrizzleDb } from '../../common/drizzle/drizzle.module';
import { newId } from '../../common/drizzle/id';
import {
  complaintViewers,
  departments,
  grievances,
  type GrievanceRow,
  type NewGrievanceRow,
} from '../../common/drizzle/schema';
import { NotificationsService } from '../notifications/notifications.service';

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
 *
 * Department-scoped access: ADMIN sees every complaint; STAFF sees only
 * complaints from departments they are granted access to via
 * `complaint_viewers`. Status changes trigger email/SMS notifications to the
 * complainant.
 */
@Injectable()
export class ComplaintsService {
  private readonly logger = new Logger(ComplaintsService.name);

  constructor(
    @Inject(DRIZZLE) private readonly db: DrizzleDb,
    private readonly notifications: NotificationsService
  ) {}

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
  // Public tracking
  // -------------------------------------------------------------------------

  async track(id: string): Promise<ComplaintWithDetails> {
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
      .where(
        and(
          eq(grievances.id, id),
          isNotNull(grievances.complaintStatus)
        )
      )
      .limit(1);

    if (!row) throw new NotFoundException('Complaint not found');
    return row;
  }

  // -------------------------------------------------------------------------
  // Authorization helpers
  // -------------------------------------------------------------------------

  /**
   * Departments the actor may read complaints for, or `null` for unrestricted
   * (ADMIN). Empty array = no grants = nothing visible.
   */
  async accessibleDepartmentIds(userId: string, role: string): Promise<string[] | null> {
    if (role === UserRole.ADMIN) return null;

    const rows = await this.db
      .select({ departmentId: complaintViewers.departmentId })
      .from(complaintViewers)
      .where(eq(complaintViewers.userId, userId));

    return rows.map((row) => row.departmentId);
  }

  /**
   * Returns the department filter condition for the actor, plus whether the
   * actor is unrestricted (ADMIN).
   */
  async departmentCondition(userId: string, role: string): Promise<{ condition: any; unrestricted: boolean }> {
    if (role === UserRole.ADMIN) {
      return { condition: undefined, unrestricted: true };
    }

    const ids = await this.accessibleDepartmentIds(userId, role);
    if (!ids || ids.length === 0) {
      // No grants — nothing visible. Use a condition that matches nothing.
      return { condition: eq(grievances.id, sql`''`), unrestricted: false };
    }

    return { condition: inArray(grievances.departmentId, ids), unrestricted: false };
  }

  // -------------------------------------------------------------------------
  // Admin reads
  // -------------------------------------------------------------------------

  async findAll(
    pagination: PaginationDto,
    filters: ComplaintQueryDto,
    userId?: string,
    userRole?: string
  ) {
    const page = pagination.page ?? 1;
    const limit = pagination.limit ?? 10;
    const offset = (page - 1) * limit;

    const conditions = [
      // Only surface rows submitted through the simple complaint form.
      isNotNull(grievances.complaintStatus),
    ];

    // Department-scoped access for non-ADMIN users.
    if (userRole && userRole !== UserRole.ADMIN && userId) {
      const { condition } = await this.departmentCondition(userId, userRole);
      if (condition) conditions.push(condition);
    }

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

  async findById(id: string, userId?: string, userRole?: string): Promise<ComplaintWithDetails> {
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

    // Enforce department scope for non-ADMIN users.
    if (userRole && userRole !== UserRole.ADMIN && userId) {
      const accessible = await this.accessibleDepartmentIds(userId, userRole);
      if (
        accessible === null ||
        !accessible.includes(row.departmentId ?? '')
      ) {
        throw new ForbiddenException('You do not have access to this department');
      }
    }

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

    const existing = await this.findById(id, userId, userRole);

    // Enforce department scope on the update too.
    if (userRole !== UserRole.ADMIN && userId) {
      const accessible = await this.accessibleDepartmentIds(userId, userRole);
      if (
        accessible === null ||
        !accessible.includes(existing.departmentId ?? '')
      ) {
        throw new ForbiddenException('You do not have access to this department');
      }
    }

    const oldStatus = (existing.complaintStatus ?? ComplaintStatus.SUBMITTED) as ComplaintStatus;

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

    // Best-effort notification: never blocks the status transition.
    await this.notifications.notifyStatusChange({
      complaintId: updated.id,
      name: existing.name,
      email: existing.email || undefined,
      phone: existing.phone || undefined,
      departmentName: existing.departmentName ?? undefined,
      oldStatus,
      newStatus: status,
      resolution: updated.resolution ?? undefined,
    }).catch((error) => {
      // Notification failures must not roll back the status change.
      this.logger?.error?.(
        `Notification failed for complaint ${id}: ${(error as Error).message}`
      );
    });

    return updated;
  }

  async getStats(userId?: string, userRole?: string) {
    const conditions = [isNotNull(grievances.complaintStatus)];

    if (userRole && userRole !== UserRole.ADMIN && userId) {
      const { condition } = await this.departmentCondition(userId, userRole);
      if (condition) conditions.push(condition);
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const total = await this.db.select({ value: count() }).from(grievances).where(where);

    const byStatus = await this.db
      .select({ status: grievances.complaintStatus, value: count() })
      .from(grievances)
      .where(where)
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

  // -------------------------------------------------------------------------
  // Export
  // -------------------------------------------------------------------------

  async exportCsv(userId?: string, userRole?: string): Promise<string> {
    const conditions = [isNotNull(grievances.complaintStatus)];

    if (userRole && userRole !== UserRole.ADMIN && userId) {
      const { condition } = await this.departmentCondition(userId, userRole);
      if (condition) conditions.push(condition);
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const rows = await this.db
      .select({
        id: grievances.id,
        name: grievances.name,
        email: grievances.email,
        phone: grievances.phone,
        departmentId: grievances.departmentId,
        complaint: grievances.description,
        complaintStatus: grievances.complaintStatus,
        imageUrl: grievances.imageUrl,
        resolution: grievances.resolution,
        createdAt: grievances.createdAt,
        updatedAt: grievances.updatedAt,
        departmentName: departments.name,
      })
      .from(grievances)
      .leftJoin(departments, eq(grievances.departmentId, departments.id))
      .where(where)
      .orderBy(desc(grievances.createdAt));

    const escapeCsv = (value: string | null | undefined): string => {
      if (value === null || value === undefined) return '';
      const str = String(value);
      if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const header = [
      'Complaint ID',
      'Name',
      'Email',
      'Phone',
      'Department',
      'Complaint',
      'Status',
      'Resolution',
      'Created At',
      'Updated At',
      'Image URL',
    ];

    const lines = [header.join(',')];
    for (const row of rows) {
      lines.push([
        escapeCsv(row.id),
        escapeCsv(row.name),
        escapeCsv(row.email),
        escapeCsv(row.phone),
        escapeCsv(row.departmentName ?? ''),
        escapeCsv(row.complaint ?? ''),
        escapeCsv(String(row.complaintStatus ?? '')),
        escapeCsv(row.resolution ?? ''),
        escapeCsv(row.createdAt?.toISOString() ?? ''),
        escapeCsv(row.updatedAt?.toISOString() ?? ''),
        escapeCsv(row.imageUrl ?? ''),
      ].join(','));
    }

    return lines.join('\n');
  }
}
