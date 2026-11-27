import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, asc, desc, eq, inArray } from 'drizzle-orm';
import { UserRole } from '@dh-araria/shared';

import { DRIZZLE, type DrizzleDb } from '../../common/drizzle/drizzle.module';
import { newId } from '../../common/drizzle/id';
import {
  complaintViewers,
  departments,
  qualityEventTasks,
  qualityEvents,
  users,
  type NewQualityEventRow,
  type NewQualityEventTaskRow,
} from '../../common/drizzle/schema';

import type {
  CreateQualityEventDto,
  CreateQualityEventTaskDto,
  UpdateQualityEventDto,
} from './dto/quality-event.dto';
import {
  assessDepartmentReadiness,
  buildDefaultChecklistForDepartment,
  computeDeadlineState,
  type ReadinessLevel,
} from './quality-checklists';

const READINESS_PRIORITY: Record<ReadinessLevel, number> = {
  support_required: 0,
  needs_attention: 1,
  on_track: 2,
  ready: 3,
};

@Injectable()
export class QualityEventsService {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDb) {}

  async accessibleDepartmentIds(userId: string): Promise<string[]> {
    const rows = await this.db
      .select({ departmentId: complaintViewers.departmentId })
      .from(complaintViewers)
      .where(eq(complaintViewers.userId, userId));

    return rows.map((row) => row.departmentId);
  }

  async findAll(userId?: string, userRole?: string) {
    const isAdmin = userRole === UserRole.ADMIN;
    const events = await this.db
      .select()
      .from(qualityEvents)
      .where(
        isAdmin ? undefined : and(eq(qualityEvents.isActive, true), eq(qualityEvents.isArchived, false))
      )
      .orderBy(desc(qualityEvents.isActive), asc(qualityEvents.isArchived), desc(qualityEvents.createdAt));

    if (events.length === 0) return [];

    const eventIds = events.map((ev) => ev.id);
    let scopedDeptIds: string[] | null = null;

    if (!isAdmin) {
      if (!userId) {
        throw new ForbiddenException('Not authorized');
      }
      scopedDeptIds = await this.accessibleDepartmentIds(userId);
    }

    const taskConditions = [inArray(qualityEventTasks.eventId, eventIds)];
    if (scopedDeptIds !== null) {
      if (scopedDeptIds.length === 0) {
        return events.map((ev) => ({
          ...ev,
          ...computeDeadlineState(ev.endDate),
          summary: {
            totalTasks: 0,
            completedTasks: 0,
            pendingTasks: 0,
            completionPercent: 0,
            totalDepartments: 0,
          },
        }));
      }
      taskConditions.push(inArray(qualityEventTasks.departmentId, scopedDeptIds));
    }

    const tasks = await this.db
      .select({
        eventId: qualityEventTasks.eventId,
        departmentId: qualityEventTasks.departmentId,
        isCompleted: qualityEventTasks.isCompleted,
      })
      .from(qualityEventTasks)
      .where(and(...taskConditions));

    const statsByEvent = new Map<
      string,
      { totalTasks: number; completedTasks: number; depts: Set<string> }
    >();

    for (const task of tasks) {
      const current = statsByEvent.get(task.eventId) ?? {
        totalTasks: 0,
        completedTasks: 0,
        depts: new Set<string>(),
      };
      current.totalTasks += 1;
      if (task.isCompleted) current.completedTasks += 1;
      current.depts.add(task.departmentId);
      statsByEvent.set(task.eventId, current);
    }

    return events.map((ev) => {
      const stats = statsByEvent.get(ev.id);
      const totalTasks = stats?.totalTasks ?? 0;
      const completedTasks = stats?.completedTasks ?? 0;
      const pendingTasks = Math.max(0, totalTasks - completedTasks);
      const completionPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

      return {
        ...ev,
        ...computeDeadlineState(ev.endDate),
        summary: {
          totalTasks,
          completedTasks,
          pendingTasks,
          completionPercent,
          totalDepartments: stats?.depts.size ?? 0,
        },
      };
    });
  }

  async findById(id: string, userRole?: string) {
    const [event] = await this.db
      .select()
      .from(qualityEvents)
      .where(eq(qualityEvents.id, id))
      .limit(1);
    if (!event) throw new NotFoundException('Quality event not found');
    if (userRole && userRole !== UserRole.ADMIN && (!event.isActive || event.isArchived)) {
      throw new ForbiddenException('This quality event is not currently active');
    }
    return {
      ...event,
      ...computeDeadlineState(event.endDate),
    };
  }

  async create(data: CreateQualityEventDto & { userId: string }) {
    const startDate = data.startDate ? new Date(data.startDate) : new Date();
    const endDate = data.endDate ? new Date(data.endDate) : null;

    if (Number.isNaN(startDate.getTime())) {
      throw new BadRequestException('Invalid startDate');
    }
    if (endDate && Number.isNaN(endDate.getTime())) {
      throw new BadRequestException('Invalid endDate');
    }
    if (endDate && endDate.getTime() < startDate.getTime()) {
      throw new BadRequestException('Deadline date must be on or after the start date');
    }

    let selectedDepartments: Array<{ id: string; name: string }> = [];
    if (data.departmentIds && data.departmentIds.length > 0) {
      const uniqueIds = [...new Set(data.departmentIds)];
      selectedDepartments = await this.db
        .select({ id: departments.id, name: departments.name })
        .from(departments)
        .where(inArray(departments.id, uniqueIds));
      if (selectedDepartments.length !== uniqueIds.length) {
        throw new BadRequestException('One or more selected departments were not found');
      }
    } else {
      selectedDepartments = await this.db
        .select({ id: departments.id, name: departments.name })
        .from(departments)
        .where(eq(departments.isActive, true))
        .orderBy(asc(departments.name));
    }

    const now = new Date();
    const normalizedType = data.type.trim().toUpperCase();

    return this.db.transaction(async (tx) => {
      const [created] = await tx
        .insert(qualityEvents)
        .values({
          id: newId(),
          type: normalizedType,
          title: data.title.trim(),
          description: data.description?.trim() || null,
          startDate,
          endDate,
          isActive: data.isActive ?? true,
          isArchived: false,
          createdBy: data.userId,
          createdAt: now,
          updatedAt: now,
        })
        .returning();

      const taskRows: NewQualityEventTaskRow[] = [];
      for (const dept of selectedDepartments) {
        const customForDept = Array.isArray(data.departmentTasks?.[dept.id])
          ? data.departmentTasks?.[dept.id]
          : undefined;
        const checklist = buildDefaultChecklistForDepartment(
          normalizedType,
          dept.name,
          data.commonTasks,
          customForDept
        );

        for (const title of checklist) {
          taskRows.push({
            id: newId(),
            eventId: created.id,
            departmentId: dept.id,
            title,
            description: null,
            isCompleted: false,
            createdAt: now,
            updatedAt: now,
          });
        }
      }

      if (taskRows.length > 0) {
        await tx.insert(qualityEventTasks).values(taskRows);
      }

      return {
        ...created,
        ...computeDeadlineState(created.endDate),
        tasksCreated: taskRows.length,
        departmentsIncluded: selectedDepartments.length,
      };
    });
  }

  async update(id: string, data: UpdateQualityEventDto) {
    await this.findById(id);
    const patch: Partial<NewQualityEventRow> = { updatedAt: new Date() };
    if (data.title !== undefined) patch.title = data.title.trim();
    if (data.description !== undefined) patch.description = data.description.trim() || null;
    if (data.isActive !== undefined) patch.isActive = data.isActive;
    if (data.isArchived !== undefined) patch.isArchived = data.isArchived;
    if (data.endDate !== undefined) {
      if (!data.endDate) {
        patch.endDate = null;
      } else {
        const parsed = new Date(data.endDate);
        if (Number.isNaN(parsed.getTime())) {
          throw new BadRequestException('Invalid deadline date');
        }
        patch.endDate = parsed;
      }
    }

    const [updated] = await this.db
      .update(qualityEvents)
      .set(patch)
      .where(eq(qualityEvents.id, id))
      .returning();
    return {
      ...updated,
      ...computeDeadlineState(updated.endDate),
    };
  }

  async delete(id: string) {
    await this.findById(id);
    await this.db.delete(qualityEvents).where(eq(qualityEvents.id, id));
    return { success: true as const };
  }

  async getTasks(
    eventId: string,
    userId?: string,
    userRole?: string,
    departmentId?: string
  ) {
    await this.findById(eventId, userRole);
    const isAdmin = userRole === UserRole.ADMIN;
    const conditions = [eq(qualityEventTasks.eventId, eventId)];

    if (!isAdmin) {
      if (!userId) {
        throw new ForbiddenException('Not authorized');
      }
      const allowedDeptIds = await this.accessibleDepartmentIds(userId);
      if (allowedDeptIds.length === 0) {
        return [];
      }
      if (departmentId) {
        if (!allowedDeptIds.includes(departmentId)) {
          throw new ForbiddenException('You do not have access to this department checklist');
        }
        conditions.push(eq(qualityEventTasks.departmentId, departmentId));
      } else {
        conditions.push(inArray(qualityEventTasks.departmentId, allowedDeptIds));
      }
    } else if (departmentId) {
      conditions.push(eq(qualityEventTasks.departmentId, departmentId));
    }

    return this.db
      .select({
        id: qualityEventTasks.id,
        eventId: qualityEventTasks.eventId,
        departmentId: qualityEventTasks.departmentId,
        departmentName: departments.name,
        title: qualityEventTasks.title,
        description: qualityEventTasks.description,
        isCompleted: qualityEventTasks.isCompleted,
        completedBy: qualityEventTasks.completedBy,
        completedByName: users.name,
        completedAt: qualityEventTasks.completedAt,
        createdAt: qualityEventTasks.createdAt,
        updatedAt: qualityEventTasks.updatedAt,
      })
      .from(qualityEventTasks)
      .innerJoin(departments, eq(qualityEventTasks.departmentId, departments.id))
      .leftJoin(users, eq(qualityEventTasks.completedBy, users.id))
      .where(and(...conditions))
      .orderBy(asc(departments.name), asc(qualityEventTasks.createdAt));
  }

  async addTasks(eventId: string, dto: CreateQualityEventTaskDto) {
    await this.findById(eventId);
    const title = dto.title.trim();
    const description = dto.description?.trim() || null;

    let targetDeptIds: string[] = [];
    if (dto.departmentId === 'ALL') {
      const existingRows = await this.db
        .select({ departmentId: qualityEventTasks.departmentId })
        .from(qualityEventTasks)
        .where(eq(qualityEventTasks.eventId, eventId));
      targetDeptIds = [...new Set(existingRows.map((row) => row.departmentId))];
      if (targetDeptIds.length === 0) {
        const activeDepts = await this.db
          .select({ id: departments.id })
          .from(departments)
          .where(eq(departments.isActive, true));
        targetDeptIds = activeDepts.map((d) => d.id);
      }
    } else {
      const [dept] = await this.db
        .select({ id: departments.id })
        .from(departments)
        .where(eq(departments.id, dto.departmentId))
        .limit(1);
      if (!dept) throw new NotFoundException('Department not found');
      targetDeptIds = [dept.id];
    }

    const now = new Date();
    const rows: NewQualityEventTaskRow[] = targetDeptIds.map((deptId) => ({
      id: newId(),
      eventId,
      departmentId: deptId,
      title,
      description,
      isCompleted: false,
      createdAt: now,
      updatedAt: now,
    }));

    if (rows.length === 0) return [];
    return this.db.insert(qualityEventTasks).values(rows).returning();
  }

  async deleteTask(eventId: string, taskId: string) {
    await this.findById(eventId);
    const [existing] = await this.db
      .select({ id: qualityEventTasks.id })
      .from(qualityEventTasks)
      .where(and(eq(qualityEventTasks.id, taskId), eq(qualityEventTasks.eventId, eventId)))
      .limit(1);
    if (!existing) throw new NotFoundException('Task not found');

    await this.db.delete(qualityEventTasks).where(eq(qualityEventTasks.id, taskId));
    return { success: true as const };
  }

  async completeTask(
    eventId: string,
    taskId: string,
    userId: string,
    userRole: string,
    isCompleted: boolean,
    remarks?: string
  ) {
    const event = await this.findById(eventId);
    const [task] = await this.db
      .select()
      .from(qualityEventTasks)
      .where(and(eq(qualityEventTasks.id, taskId), eq(qualityEventTasks.eventId, eventId)))
      .limit(1);
    if (!task) throw new NotFoundException('Task not found');

    if (userRole !== UserRole.ADMIN && userRole !== UserRole.STAFF) {
      throw new ForbiddenException('Not authorized');
    }

    if (userRole !== UserRole.ADMIN) {
      if (!event.isActive || event.isArchived) {
        throw new ForbiddenException('This quality event is no longer active for updates');
      }
      const allowedDeptIds = await this.accessibleDepartmentIds(userId);
      if (!allowedDeptIds.includes(task.departmentId)) {
        throw new ForbiddenException(
          'You can only update checklist items for your assigned departments'
        );
      }
    }

    const patch: Partial<NewQualityEventTaskRow> = {
      isCompleted,
      completedBy: isCompleted ? userId : null,
      completedAt: isCompleted ? new Date() : null,
      updatedAt: new Date(),
    };
    if (remarks !== undefined) {
      patch.description = remarks.trim() || null;
    }

    const [updated] = await this.db
      .update(qualityEventTasks)
      .set(patch)
      .where(eq(qualityEventTasks.id, taskId))
      .returning();
    return updated;
  }

  async getProgress(eventId: string) {
    const event = await this.findById(eventId);
    const tasks = await this.db
      .select({
        id: qualityEventTasks.id,
        departmentId: qualityEventTasks.departmentId,
        title: qualityEventTasks.title,
        description: qualityEventTasks.description,
        isCompleted: qualityEventTasks.isCompleted,
        completedAt: qualityEventTasks.completedAt,
      })
      .from(qualityEventTasks)
      .where(eq(qualityEventTasks.eventId, eventId))
      .orderBy(asc(qualityEventTasks.createdAt));

    const deptIds = [...new Set(tasks.map((t) => t.departmentId))];
    const [depts, inchargeRows] = await Promise.all([
      deptIds.length
        ? this.db.select().from(departments).where(inArray(departments.id, deptIds))
        : Promise.resolve([]),
      deptIds.length
        ? this.db
            .select({
              departmentId: complaintViewers.departmentId,
              userId: users.id,
              name: users.name,
              email: users.email,
              phone: users.phone,
              isActive: users.isActive,
            })
            .from(complaintViewers)
            .innerJoin(users, eq(complaintViewers.userId, users.id))
            .where(inArray(complaintViewers.departmentId, deptIds))
        : Promise.resolve([]),
    ]);

    const nameMap = new Map(depts.map((d) => [d.id, d.name]));
    const inchargesByDept = new Map<
      string,
      Array<{ id: string; name: string; email: string; phone: string | null }>
    >();

    for (const row of inchargeRows) {
      if (!row.isActive) continue;
      const list = inchargesByDept.get(row.departmentId) ?? [];
      list.push({
        id: row.userId,
        name: row.name,
        email: row.email,
        phone: row.phone,
      });
      inchargesByDept.set(row.departmentId, list);
    }

    const tasksByDept = new Map<string, typeof tasks>();
    for (const task of tasks) {
      const list = tasksByDept.get(task.departmentId) ?? [];
      list.push(task);
      tasksByDept.set(task.departmentId, list);
    }

    const gapTracker = new Map<
      string,
      { title: string; pendingDepts: Set<string>; totalDepts: Set<string> }
    >();

    const departmentReports = deptIds.map((deptId) => {
      const deptName = nameMap.get(deptId) ?? deptId;
      const deptTasks = tasksByDept.get(deptId) ?? [];
      const incharges = inchargesByDept.get(deptId) ?? [];
      const completedTasks = deptTasks.filter((t) => t.isCompleted);
      const pendingTasks = deptTasks.filter((t) => !t.isCompleted);

      for (const task of deptTasks) {
        const key = task.title.trim().toLowerCase();
        const entry = gapTracker.get(key) ?? {
          title: task.title.trim(),
          pendingDepts: new Set<string>(),
          totalDepts: new Set<string>(),
        };
        entry.totalDepts.add(deptName);
        if (!task.isCompleted) {
          entry.pendingDepts.add(deptName);
        }
        gapTracker.set(key, entry);
      }

      const assessment = assessDepartmentReadiness({
        total: deptTasks.length,
        completed: completedTasks.length,
        hasIncharge: incharges.length > 0,
        daysRemaining: event.daysRemaining,
        isOverdue: event.isOverdue,
      });

      const lastActivityDate = completedTasks.reduce<Date | null>((latest, t) => {
        if (!t.completedAt) return latest;
        if (!latest || t.completedAt.getTime() > latest.getTime()) return t.completedAt;
        return latest;
      }, null);

      return {
        departmentId: deptId,
        departmentName: deptName,
        total: deptTasks.length,
        completed: completedTasks.length,
        pending: assessment.pending,
        completionPercent: assessment.completionPercent,
        readinessLevel: assessment.readinessLevel,
        supportReason: assessment.supportReason,
        incharges,
        pendingTasks: pendingTasks.map((t) => ({
          id: t.id,
          title: t.title,
          remarks: t.description,
        })),
        completedTasks: completedTasks.map((t) => ({
          id: t.id,
          title: t.title,
          completedAt: t.completedAt,
          remarks: t.description,
        })),
        lastActivityAt: lastActivityDate ? lastActivityDate.toISOString() : null,
      };
    });

    departmentReports.sort((a, b) => {
      const priorityDiff =
        READINESS_PRIORITY[a.readinessLevel] - READINESS_PRIORITY[b.readinessLevel];
      if (priorityDiff !== 0) return priorityDiff;
      if (a.completionPercent !== b.completionPercent) {
        return a.completionPercent - b.completionPercent;
      }
      return a.departmentName.localeCompare(b.departmentName);
    });

    const totalTasks = tasks.length;
    const completedTasksCount = tasks.filter((t) => t.isCompleted).length;
    const pendingTasksCount = Math.max(0, totalTasks - completedTasksCount);
    const completionPercent =
      totalTasks > 0 ? Math.round((completedTasksCount / totalTasks) * 100) : 0;

    const commonGaps = [...gapTracker.values()]
      .filter((gap) => gap.pendingDepts.size > 0)
      .map((gap) => ({
        title: gap.title,
        pendingDepartmentsCount: gap.pendingDepts.size,
        totalDepartmentsCount: gap.totalDepts.size,
        departmentNames: [...gap.pendingDepts].sort(),
      }))
      .sort((a, b) => b.pendingDepartmentsCount - a.pendingDepartmentsCount || a.title.localeCompare(b.title))
      .slice(0, 8);

    return {
      event,
      summary: {
        totalTasks,
        completedTasks: completedTasksCount,
        pendingTasks: pendingTasksCount,
        completionPercent,
        totalDepartments: departmentReports.length,
        readyDepartments: departmentReports.filter((d) => d.readinessLevel === 'ready').length,
        onTrackDepartments: departmentReports.filter((d) => d.readinessLevel === 'on_track').length,
        needsAttentionDepartments: departmentReports.filter(
          (d) => d.readinessLevel === 'needs_attention'
        ).length,
        supportRequiredDepartments: departmentReports.filter(
          (d) => d.readinessLevel === 'support_required'
        ).length,
        unassignedDepartments: departmentReports.filter((d) => d.incharges.length === 0).length,
      },
      departments: departmentReports,
      commonGaps,
    };
  }
}
