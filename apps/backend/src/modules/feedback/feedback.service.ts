import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, asc, avg, count, desc, eq, gte, inArray, lte, type SQL } from 'drizzle-orm';
import type { AnyPgColumn } from 'drizzle-orm/pg-core';

import { FeedbackStatus, UserRole } from '@dh-araria/shared';
import type { FeedbackAccessGrant, FeedbackScope, FeedbackStats } from '@dh-araria/shared';

import { DRIZZLE, type DrizzleDb } from '../../common/drizzle/drizzle.module';
import { newId } from '../../common/drizzle/id';
import {
  departments,
  feedback,
  feedbackViewers,
  users,
  type FeedbackRow,
  type NewFeedbackRow,
} from '../../common/drizzle/schema';

import type {
  CreateFeedbackAccessDto,
  CreateFeedbackDto,
  FeedbackQueryDto,
  FeedbackStatsQueryDto,
} from './dto/feedback.dto';

/** The authenticated principal, as returned by `JwtStrategy`. */
export interface FeedbackActor {
  id: string;
  role: string;
}

/** Inbox row: the `feedback` row plus its joined department name. */
export type FeedbackWithDepartment = FeedbackRow & { departmentName: string };

/** Row shape returned by the feedback inbox query (feedback + department name). */
const FEEDBACK_COLUMNS = {
  id: feedback.id,
  departmentId: feedback.departmentId,
  departmentName: departments.name,
  serviceArea: feedback.serviceArea,
  rating: feedback.rating,
  cleanliness: feedback.cleanliness,
  staffBehaviour: feedback.staffBehaviour,
  waitTime: feedback.waitTime,
  comment: feedback.comment,
  name: feedback.name,
  phone: feedback.phone,
  email: feedback.email,
  status: feedback.status,
  createdAt: feedback.createdAt,
  updatedAt: feedback.updatedAt,
};

/** Allow-listed sort targets — `sortBy` arrives from the query string. */
const SORTABLE: Record<string, AnyPgColumn> = {
  createdAt: feedback.createdAt,
  rating: feedback.rating,
  status: feedback.status,
  serviceArea: feedback.serviceArea,
};

/** Postgres `avg()` comes back as a string; normalise and round to 1 decimal. */
function average(value: string | number | null | undefined): number | null {
  if (value === null || value === undefined) return null;
  const parsed = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(parsed)) return null;
  return Math.round(parsed * 10) / 10;
}

/**
 * A date-only `to` filter covers the whole day, not just midnight. Without
 * this, `to=2026-10-24` would silently exclude every submission made after
 * 00:00 on 24 October.
 */
function endOfDay(value: string): Date {
  const date = new Date(value);
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) date.setUTCHours(23, 59, 59, 999);
  return date;
}

/** Neutral payload for a caller with no grants (or no rows in range). */
function emptyStats(): FeedbackStats {
  const byStatus = {} as Record<FeedbackStatus, number>;
  for (const status of Object.values(FeedbackStatus)) byStatus[status] = 0;

  return {
    total: 0,
    averageRating: 0,
    averageCleanliness: 0,
    averageStaffBehaviour: 0,
    averageWaitTime: 0,
    byStatus,
    ratingDistribution: { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 },
    byDepartment: [],
  };
}

/**
 * Owns `feedback` and `feedback_viewers`.
 *
 * Authorization lives here rather than in the controller: `ADMIN` (the HM) sees
 * every department, everyone else sees only the departments granted in
 * `feedback_viewers`. A new route that reads feedback has to go through
 * `accessibleDepartmentIds()` / `requireDepartmentAccess()`, so it cannot
 * silently widen the scope.
 */
@Injectable()
export class FeedbackService {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDb) {}

  // -------------------------------------------------------------------------
  // Public write
  // -------------------------------------------------------------------------

  async create(dto: CreateFeedbackDto): Promise<FeedbackWithDepartment> {
    const [department] = await this.db
      .select({ id: departments.id, name: departments.name, isActive: departments.isActive })
      .from(departments)
      .where(eq(departments.id, dto.departmentId))
      .limit(1);

    // Inactive departments are not accepting feedback: the public form is
    // generated from the active list, so this is either stale input or a probe.
    if (!department || !department.isActive) {
      throw new NotFoundException('Department not found');
    }

    const now = new Date();
    // Built field-by-field on purpose: `status`, ids and timestamps are
    // server-owned, so nothing the caller sends can reach those columns.
    const values: NewFeedbackRow = {
      id: newId(),
      departmentId: dto.departmentId,
      serviceArea: dto.serviceArea,
      rating: dto.rating,
      cleanliness: dto.cleanliness,
      staffBehaviour: dto.staffBehaviour,
      waitTime: dto.waitTime,
      comment: dto.comment,
      name: dto.name,
      phone: dto.phone,
      email: dto.email,
      status: FeedbackStatus.NEW,
      createdAt: now,
      updatedAt: now,
    };

    const [created] = await this.db.insert(feedback).values(values).returning();

    return { ...created, departmentName: department.name };
  }

  // -------------------------------------------------------------------------
  // Authorization helpers (used by every read/write below)
  // -------------------------------------------------------------------------

  /**
   * Departments the actor may read, or `null` for unrestricted (ADMIN/HM).
   *
   * Empty array = no grants = nothing visible. Grants are the source of truth
   * here; `GET /feedback/scope` applies the "active only" filter on top for the
   * inbox picker, while a head can still read the feedback of a department that
   * was deactivated after they were granted it.
   */
  async accessibleDepartmentIds(userId: string, role: string): Promise<string[] | null> {
    if (role === UserRole.ADMIN) return null;

    const rows = await this.db
      .select({ departmentId: feedbackViewers.departmentId })
      .from(feedbackViewers)
      .where(eq(feedbackViewers.userId, userId));

    return rows.map((row) => row.departmentId);
  }

  /**
   * Loads one feedback row and enforces department scope.
   *
   * 404 when the row does not exist, 403 when it exists in a department the
   * actor cannot read. Returning the row lets callers avoid a second read.
   */
  async requireDepartmentAccess(
    id: string,
    actor: FeedbackActor
  ): Promise<{ id: string; departmentId: string }> {
    const [row] = await this.db
      .select({ id: feedback.id, departmentId: feedback.departmentId })
      .from(feedback)
      .where(eq(feedback.id, id))
      .limit(1);

    if (!row) throw new NotFoundException('Feedback not found');
    if (actor.role === UserRole.ADMIN) return row;

    const [grant] = await this.db
      .select({ id: feedbackViewers.id })
      .from(feedbackViewers)
      .where(
        and(
          eq(feedbackViewers.userId, actor.id),
          eq(feedbackViewers.departmentId, row.departmentId)
        )
      )
      .limit(1);

    if (!grant) {
      throw new ForbiddenException('You do not have access to this department');
    }

    return row;
  }

  // -------------------------------------------------------------------------
  // Scoped reads
  // -------------------------------------------------------------------------

  async getScope(actor: FeedbackActor): Promise<FeedbackScope> {
    if (actor.role === UserRole.ADMIN) {
      const rows = await this.db
        .select({ id: departments.id, name: departments.name })
        .from(departments)
        .where(eq(departments.isActive, true))
        .orderBy(asc(departments.name));

      return { all: true, departments: rows };
    }

    // Derived from the same helper as the inbox, so an empty scope and an empty
    // list can never disagree.
    const ids = await this.accessibleDepartmentIds(actor.id, actor.role);
    if (!ids || ids.length === 0) return { all: false, departments: [] };

    const rows = await this.db
      .select({ id: departments.id, name: departments.name })
      .from(departments)
      .where(and(inArray(departments.id, ids), eq(departments.isActive, true)))
      .orderBy(asc(departments.name));

    return { all: false, departments: rows };
  }

  async findAll(query: FeedbackQueryDto, actor: FeedbackActor) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const accessible = await this.accessibleDepartmentIds(actor.id, actor.role);

    // No grants is a valid state, not an error: the caller gets an empty page.
    if (accessible && accessible.length === 0) {
      return {
        data: [] as FeedbackWithDepartment[],
        meta: { page, limit, total: 0, totalPages: 0 },
      };
    }

    const conditions = this.buildConditions(accessible, query);
    const where = conditions.length > 0 ? and(...conditions) : undefined;
    const sortColumn = SORTABLE[query.sortBy ?? 'createdAt'] ?? feedback.createdAt;
    const orderBy = query.sortOrder === 'asc' ? asc(sortColumn) : desc(sortColumn);

    const [rows, totals] = await Promise.all([
      this.db
        .select(FEEDBACK_COLUMNS)
        .from(feedback)
        .innerJoin(departments, eq(feedback.departmentId, departments.id))
        .where(where)
        .orderBy(orderBy)
        .limit(limit)
        .offset((page - 1) * limit),
      this.db.select({ value: count() }).from(feedback).where(where),
    ]);

    const total = totals[0]?.value ?? 0;
    return { data: rows, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async getStats(query: FeedbackStatsQueryDto, actor: FeedbackActor): Promise<FeedbackStats> {
    const accessible = await this.accessibleDepartmentIds(actor.id, actor.role);
    if (accessible && accessible.length === 0) return emptyStats();

    const conditions = this.buildConditions(accessible, query);
    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const [totals] = await this.db
      .select({
        total: count(),
        averageRating: avg(feedback.rating),
        averageCleanliness: avg(feedback.cleanliness),
        averageStaffBehaviour: avg(feedback.staffBehaviour),
        averageWaitTime: avg(feedback.waitTime),
      })
      .from(feedback)
      .where(where);

    // One grouped query feeds both the status badges and the rating histogram.
    const breakdown = await this.db
      .select({ status: feedback.status, rating: feedback.rating, value: count() })
      .from(feedback)
      .where(where)
      .groupBy(feedback.status, feedback.rating);

    const byDepartment = await this.db
      .select({
        departmentId: feedback.departmentId,
        departmentName: departments.name,
        total: count(),
        averageRating: avg(feedback.rating),
      })
      .from(feedback)
      .innerJoin(departments, eq(feedback.departmentId, departments.id))
      .where(where)
      .groupBy(feedback.departmentId, departments.name)
      .orderBy(desc(count()));

    const stats = emptyStats();
    stats.total = totals?.total ?? 0;
    stats.averageRating = average(totals?.averageRating) ?? 0;
    stats.averageCleanliness = average(totals?.averageCleanliness);
    stats.averageStaffBehaviour = average(totals?.averageStaffBehaviour);
    stats.averageWaitTime = average(totals?.averageWaitTime);

    for (const row of breakdown) {
      if (row.status in stats.byStatus) {
        stats.byStatus[row.status] += row.value;
      }
      const bucket = String(row.rating) as keyof FeedbackStats['ratingDistribution'];
      if (bucket in stats.ratingDistribution) {
        stats.ratingDistribution[bucket] += row.value;
      }
    }

    stats.byDepartment = byDepartment
      .map((row) => ({
        departmentId: row.departmentId,
        departmentName: row.departmentName ?? '',
        total: row.total,
        averageRating: average(row.averageRating) ?? 0,
      }))
      .sort((a, b) => b.total - a.total || a.departmentName.localeCompare(b.departmentName));

    return stats;
  }

  // -------------------------------------------------------------------------
  // Scoped status workflow
  // -------------------------------------------------------------------------

  async updateStatus(
    id: string,
    status: FeedbackStatus,
    actor: FeedbackActor
  ): Promise<FeedbackRow> {
    await this.requireDepartmentAccess(id, actor);

    const [updated] = await this.db
      .update(feedback)
      .set({ status, updatedAt: new Date() })
      .where(eq(feedback.id, id))
      .returning();

    return updated;
  }

  // -------------------------------------------------------------------------
  // Grant management
  //
  // Declared ADMIN-only on the controller, and re-checked here: a future route
  // that calls into this service must not be able to hand out grants either.
  // -------------------------------------------------------------------------

  async listAccess(actor: FeedbackActor): Promise<FeedbackAccessGrant[]> {
    this.assertAdmin(actor);

    return this.db
      .select({
        id: feedbackViewers.id,
        userId: feedbackViewers.userId,
        userName: users.name,
        userEmail: users.email,
        departmentId: feedbackViewers.departmentId,
        departmentName: departments.name,
        grantedBy: feedbackViewers.grantedBy,
        createdAt: feedbackViewers.createdAt,
      })
      .from(feedbackViewers)
      .innerJoin(users, eq(feedbackViewers.userId, users.id))
      .innerJoin(departments, eq(feedbackViewers.departmentId, departments.id))
      .orderBy(desc(feedbackViewers.createdAt));
  }

  async createAccess(
    dto: CreateFeedbackAccessDto,
    actor: FeedbackActor
  ): Promise<FeedbackAccessGrant[]> {
    this.assertAdmin(actor);

    const [user] = await this.db
      .select({ id: users.id, role: users.role })
      .from(users)
      .where(eq(users.id, dto.userId))
      .limit(1);

    if (!user) throw new NotFoundException('User not found');

    // Feedback is about the hospital's own service quality, so only people who
    // work in it can be granted access. A patient account reading other
    // patients' comments (and any contact details they left) would be a
    // privacy leak dressed up as an admin action.
    if (user.role === UserRole.PATIENT) {
      throw new BadRequestException(
        'Feedback access can only be granted to hospital staff accounts'
      );
    }

    const departmentIds = [...new Set(dto.departmentIds)];
    const found = await this.db
      .select({ id: departments.id })
      .from(departments)
      .where(inArray(departments.id, departmentIds));

    if (found.length !== departmentIds.length) {
      throw new NotFoundException('One or more departments were not found');
    }

    const now = new Date();
    await this.db
      .insert(feedbackViewers)
      .values(
        departmentIds.map((departmentId) => ({
          id: newId(),
          userId: dto.userId,
          departmentId,
          grantedBy: actor.id,
          createdAt: now,
        }))
      )
      // Re-granting is a no-op: the unique (userId, departmentId) index wins.
      .onConflictDoNothing();

    // Return the current state, not just the newly inserted rows, so a repeated
    // POST is idempotent from the caller's point of view.
    return this.db
      .select({
        id: feedbackViewers.id,
        userId: feedbackViewers.userId,
        userName: users.name,
        userEmail: users.email,
        departmentId: feedbackViewers.departmentId,
        departmentName: departments.name,
        grantedBy: feedbackViewers.grantedBy,
        createdAt: feedbackViewers.createdAt,
      })
      .from(feedbackViewers)
      .innerJoin(users, eq(feedbackViewers.userId, users.id))
      .innerJoin(departments, eq(feedbackViewers.departmentId, departments.id))
      .where(
        and(
          eq(feedbackViewers.userId, dto.userId),
          inArray(feedbackViewers.departmentId, departmentIds)
        )
      )
      .orderBy(desc(feedbackViewers.createdAt));
  }

  async deleteAccess(id: string, actor: FeedbackActor): Promise<{ deleted: true }> {
    this.assertAdmin(actor);

    const [grant] = await this.db
      .select({ id: feedbackViewers.id })
      .from(feedbackViewers)
      .where(eq(feedbackViewers.id, id))
      .limit(1);

    if (!grant) throw new NotFoundException('Feedback access grant not found');

    await this.db.delete(feedbackViewers).where(eq(feedbackViewers.id, id));

    return { deleted: true };
  }

  // -------------------------------------------------------------------------
  // Internals
  // -------------------------------------------------------------------------

  private assertAdmin(actor: FeedbackActor): void {
    if (actor.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only ADMIN may manage feedback access grants');
    }
  }

  private buildConditions(
    accessible: string[] | null,
    filters: Pick<FeedbackQueryDto, 'departmentId' | 'status' | 'serviceArea' | 'from' | 'to'>
  ): SQL[] {
    const conditions: SQL[] = [];

    // `null` means ADMIN — no department predicate at all.
    if (accessible) conditions.push(inArray(feedback.departmentId, accessible));
    if (filters.departmentId) conditions.push(eq(feedback.departmentId, filters.departmentId));
    if (filters.status) conditions.push(eq(feedback.status, filters.status));
    if (filters.serviceArea) conditions.push(eq(feedback.serviceArea, filters.serviceArea));
    if (filters.from) conditions.push(gte(feedback.createdAt, new Date(filters.from)));
    if (filters.to) conditions.push(lte(feedback.createdAt, endOfDay(filters.to)));

    return conditions;
  }
}
