import { BadRequestException, ForbiddenException, Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { and, asc, count, desc, eq, inArray, isNotNull, sql } from 'drizzle-orm';
import { ComplaintStatus, UserRole, isStaffRole } from '@dh-araria/shared';

import { PaginationDto } from '../../common/dto/pagination.dto';
import { DRIZZLE, type DrizzleDb } from '../../common/drizzle/drizzle.module';
import { newId } from '../../common/drizzle/id';
import {
  complaintStatusHistory,
  complaintViewers,
  departments,
  grievances,
  users,
  type GrievanceRow,
  type NewGrievanceRow,
} from '../../common/drizzle/schema';
import { NotificationsService } from '../notifications/notifications.service';

import type {
  CreateComplaintDto,
  ComplaintQueryDto,
  UpdateComplaintStatusDto,
} from './dto/complaint.dto';

export interface ComplaintWithDetails extends GrievanceRow {
  departmentName?: string | null;
  /** Display name of the account that last moved this complaint. */
  assignedToName?: string | null;
  /** Oldest first, so the UI can render it as a timeline. */
  history?: ComplaintHistoryEntry[];
}

/** One status transition as returned to ADMIN and STAFF callers. */
export interface ComplaintHistoryEntry {
  id: string;
  complaintId: string;
  fromStatus: ComplaintStatus | null;
  toStatus: ComplaintStatus;
  resolution: string | null;
  changedBy: string | null;
  changedByName: string;
  changedByRole: string | null;
  createdAt: Date;
}

type Select = typeof grievances.$inferSelect;
type Insert = typeof grievances.$inferInsert;

/**
 * Only renderable photo references leave the API.
 *
 * Complaints submitted before the photo pipeline was fixed hold `blob:` URLs,
 * which only ever resolved inside the browser tab that created them. Returning
 * them hands the admin panel a permanently broken image, so they read as "no
 * photo" until the row is re-submitted.
 */
const DISPLAYABLE_IMAGE_PATTERN = /^(?:https?:\/\/|data:image\/(?:jpeg|png|webp);base64,)/i;

function toDisplayableImageUrl(value: string | null | undefined): string | null {
  return typeof value === 'string' && DISPLAYABLE_IMAGE_PATTERN.test(value) ? value : null;
}

/**
 * Owns public complaint submission and admin-side complaint tracking.
 *
 * ADMIN sees every complaint — no department restrictions, period.
 * STAFF sees only complaints from departments they are granted access to
 * via `complaint_viewers`.
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
    try {
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
        imageUrl: toDisplayableImageUrl(dto.imageUrl),
        createdAt: now,
        updatedAt: now,
      } as Insert;

      // The complaint and its first history entry are one unit: a complaint
      // must never exist without a row explaining how it got its status.
      return await this.db.transaction(async (tx) => {
        const [created] = await tx.insert(grievances).values(values).returning();

        await tx.insert(complaintStatusHistory).values({
          id: newId(),
          complaintId: created.id,
          fromStatus: null,
          toStatus: ComplaintStatus.SUBMITTED,
          resolution: null,
          changedBy: null,
          changedByName: dto.name,
          changedByRole: null,
          createdAt: now,
        });

        return created;
      });
    } catch (error) {
      const err = error as Error;
      this.logger.error(
        `Failed to create complaint: ${err.message}\nStack: ${err.stack}`,
      );
      if (err instanceof NotFoundException) {
        throw err;
      }
      throw new BadRequestException('Unable to submit complaint. Please try again.');
    }
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
      .where(and(eq(grievances.id, id), isNotNull(grievances.complaintStatus)))
      .limit(1);

    if (!row) throw new NotFoundException('Complaint not found');
    return { ...row, imageUrl: toDisplayableImageUrl(row.imageUrl) };
  }

  // -------------------------------------------------------------------------
  // Authorization helper — STAFF only
  // -------------------------------------------------------------------------

  /**
   * Returns department IDs the STAFF user may read complaints for.
   * ADMIN is unrestricted (handled by callers skipping this entirely).
   */
  async accessibleDepartmentIds(userId: string): Promise<string[]> {
    const rows = await this.db
      .select({ departmentId: complaintViewers.departmentId })
      .from(complaintViewers)
      .where(eq(complaintViewers.userId, userId));

    return rows.map((row) => row.departmentId);
  }

  // -------------------------------------------------------------------------
  // Admin reads (ADMIN sees everything — no department filtering)
  // -------------------------------------------------------------------------

  /**
   * Builds the WHERE conditions for complaint queries.
   *
   * ADMIN: no department filter — sees every complaint.
   * STAFF: only departments granted via `complaint_viewers`.
   *
   * Used by findAll(), getStats(), and exportCsv() so all three always agree.
   */
  private async buildComplaintConditions(
    userId?: string,
    userRole?: string,
    filters?: ComplaintQueryDto
  ): Promise<any[]> {
    const conditions = [
      // Only surface rows submitted through the simple complaint form.
      isNotNull(grievances.complaintStatus),
    ];

    // Department-scoped access for STAFF only. ADMIN sees everything.
    if (userRole && userRole !== UserRole.ADMIN && userId) {
      const ids = await this.accessibleDepartmentIds(userId);
      if (ids.length === 0) {
        conditions.push(eq(grievances.id, sql`''`)); // matches nothing
      } else {
        conditions.push(inArray(grievances.departmentId, ids));
      }
    }

    if (filters?.departmentId && filters.departmentId.trim().length > 0) {
      conditions.push(eq(grievances.departmentId, filters.departmentId.trim()));
    }
    if (filters?.status && filters.status.trim().length > 0) {
      conditions.push(
        eq(
          grievances.complaintStatus,
          filters.status.trim() as NonNullable<Select['complaintStatus']>
        )
      );
    }
    if (filters?.assignedTo && filters.assignedTo.trim().length > 0) {
      conditions.push(eq(grievances.assignedTo, filters.assignedTo.trim()));
    }

    return conditions;
  }

  async findAll(
    pagination: PaginationDto,
    filters: ComplaintQueryDto,
    userId?: string,
    userRole?: string
  ) {
    const page = pagination.page ?? 1;
    const limit = pagination.limit ?? 10;
    const offset = (page - 1) * limit;

    const conditions = await this.buildComplaintConditions(userId, userRole, filters);
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
          assignedToName: users.name,
        })
        .from(grievances)
        .leftJoin(departments, eq(grievances.departmentId, departments.id))
        .leftJoin(users, eq(grievances.assignedTo, users.id))
        .where(where)
        .orderBy(orderBy)
        .limit(limit)
        .offset(offset),
      this.db.select({ value: count() }).from(grievances).where(where),
    ]);

    // One batched query for the page, not one per card.
    const histories = await this.loadHistories(rows.map((row) => row.id));

    const total = totals[0]?.value ?? 0;
    return {
      data: rows.map((row) => ({
        ...row,
        imageUrl: toDisplayableImageUrl(row.imageUrl),
        history: histories.get(row.id) ?? [],
      })),
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  // -------------------------------------------------------------------------
  // Status history
  // -------------------------------------------------------------------------

  private async loadHistories(complaintIds: string[]) {
    const byComplaint = new Map<string, ComplaintHistoryEntry[]>();
    if (complaintIds.length === 0) return byComplaint;

    const rows = await this.db
      .select({
        id: complaintStatusHistory.id,
        complaintId: complaintStatusHistory.complaintId,
        fromStatus: complaintStatusHistory.fromStatus,
        toStatus: complaintStatusHistory.toStatus,
        resolution: complaintStatusHistory.resolution,
        changedBy: complaintStatusHistory.changedBy,
        changedByName: complaintStatusHistory.changedByName,
        changedByRole: complaintStatusHistory.changedByRole,
        createdAt: complaintStatusHistory.createdAt,
      })
      .from(complaintStatusHistory)
      .where(inArray(complaintStatusHistory.complaintId, complaintIds))
      .orderBy(asc(complaintStatusHistory.createdAt));

    for (const row of rows) {
      const list = byComplaint.get(row.complaintId) ?? [];
      list.push(row as ComplaintHistoryEntry);
      byComplaint.set(row.complaintId, list);
    }

    return byComplaint;
  }

  /** Oldest-first transition list for one complaint. */
  async getHistory(complaintId: string): Promise<ComplaintHistoryEntry[]> {
    const histories = await this.loadHistories([complaintId]);
    return histories.get(complaintId) ?? [];
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
        assignedToName: users.name,
      })
      .from(grievances)
      .leftJoin(departments, eq(grievances.departmentId, departments.id))
      .leftJoin(users, eq(grievances.assignedTo, users.id))
      .where(eq(grievances.id, id))
      .limit(1);

    if (!row) throw new NotFoundException('Complaint not found');

    // STAFF department scope check — ADMIN bypasses entirely.
    if (userRole && userRole !== UserRole.ADMIN && userId) {
      const accessible = await this.accessibleDepartmentIds(userId);
      if (!accessible.includes(row.departmentId ?? '')) {
        throw new ForbiddenException('You do not have access to this department');
      }
    }

    return {
      ...row,
      imageUrl: toDisplayableImageUrl(row.imageUrl),
      history: await this.getHistory(id),
    };
  }

  // -------------------------------------------------------------------------
  // Admin status workflow
  // -------------------------------------------------------------------------

  async updateStatus(
    id: string,
    status: ComplaintStatus,
    userId: string,
    userRole: string,
    actorName: string,
    resolution?: string
  ): Promise<GrievanceRow> {
    if (!isStaffRole(userRole)) {
      throw new ForbiddenException('Not authorized to update complaint status');
    }

    const existing = await this.findById(id, userId, userRole);

    // STAFF department scope check — ADMIN bypasses entirely.
    if (userRole !== UserRole.ADMIN && userId) {
      const accessible = await this.accessibleDepartmentIds(userId);
      if (!accessible.includes(existing.departmentId ?? '')) {
        throw new ForbiddenException('You do not have access to this department');
      }
    }

    const oldStatus = (existing.complaintStatus ?? ComplaintStatus.SUBMITTED) as ComplaintStatus;
    const now = new Date();

    // The status change and its trail commit together, so the admin panel can
    // never show a status that no history entry explains.
    const updated = await this.db.transaction(async (tx) => {
      const [row] = await tx
        .update(grievances)
        .set({
          complaintStatus: status,
          status:
            status === ComplaintStatus.RESOLVED || status === ComplaintStatus.CLOSED
              ? 'RESOLVED'
              : status,
          resolution,
          assignedTo: userId,
          updatedAt: now,
        } as Partial<Insert>)
        .where(eq(grievances.id, id))
        .returning();

      await tx.insert(complaintStatusHistory).values({
        id: newId(),
        complaintId: id,
        fromStatus: oldStatus,
        toStatus: status,
        resolution: resolution ?? null,
        changedBy: userId,
        changedByName: actorName,
        changedByRole: userRole === UserRole.ADMIN ? UserRole.ADMIN : UserRole.STAFF,
        createdAt: now,
      });

      return row;
    });

    // Best-effort notification: never blocks the status transition.
    await this.notifications
      .notifyStatusChange({
        complaintId: updated.id,
        name: existing.name,
        email: existing.email || undefined,
        phone: existing.phone || undefined,
        departmentName: existing.departmentName ?? undefined,
        oldStatus,
        newStatus: status,
        resolution: updated.resolution ?? undefined,
      })
      .catch((error) => {
        this.logger?.error?.(
          `Notification failed for complaint ${id}: ${(error as Error).message}`
        );
      });

    return updated;
  }

  async getStats(userId?: string, userRole?: string) {
    const conditions = await this.buildComplaintConditions(userId, userRole);
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
    const conditions = await this.buildComplaintConditions(userId, userRole);
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
      lines.push(
        [
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
          escapeCsv(toDisplayableImageUrl(row.imageUrl) ?? ''),
        ].join(',')
      );
    }

    return lines.join('\n');
  }
}
