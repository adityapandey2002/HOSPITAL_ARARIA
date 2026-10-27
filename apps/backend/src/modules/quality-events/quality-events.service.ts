import { ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, asc, desc, eq, inArray } from 'drizzle-orm';

import { DRIZZLE, type DrizzleDb } from '../../common/drizzle/drizzle.module';
import { newId } from '../../common/drizzle/id';
import {
  departments,
  qualityEventTasks,
  qualityEvents,
  type NewQualityEventRow,
  type NewQualityEventTaskRow,
  type QualityEventRow,
  type QualityEventTaskRow,
} from '../../common/drizzle/schema';
import { isStaffRole } from '@dh-araria/shared';

const TASK_TEMPLATES: Record<string, string[]> = {
  NQAS: [
    'Documented SOPs available and up to date',
    'Staff training records maintained',
    'Equipment calibration logs complete',
    'Patient feedback mechanism in place',
    'Infection control audit completed',
  ],
  KAYAKALP: [
    'Cleanliness inspection passed',
    'Waste segregation implemented',
    'Hand hygiene compliance verified',
    'Toilet facilities maintained',
    'Hospital surroundings upkeep',
  ],
  MUSQAN: [
    'Child-friendly signage installed',
    'Pediatric OPD setup verified',
    'Vaccination cold chain maintained',
    'Growth monitoring records maintained',
    'Play area safety checked',
  ],
};

@Injectable()
export class QualityEventsService {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDb) {}

  async findAll() {
    return this.db.select().from(qualityEvents).orderBy(desc(qualityEvents.createdAt));
  }

  async findById(id: string) {
    const [event] = await this.db.select().from(qualityEvents).where(eq(qualityEvents.id, id)).limit(1);
    if (!event) throw new NotFoundException('Quality event not found');
    return event;
  }

  async create(data: {
    type: string;
    title: string;
    description?: string;
    startDate?: string;
    endDate?: string;
    departmentIds?: string[];
    userId: string;
  }) {
    const [created] = await this.db
      .insert(qualityEvents)
      .values({
        id: newId(),
        type: data.type,
        title: data.title,
        description: data.description ?? null,
        startDate: data.startDate ? new Date(data.startDate) : new Date(),
        endDate: data.endDate ? new Date(data.endDate) : null,
        createdBy: data.userId,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    const template = TASK_TEMPLATES[data.type] ?? ['Complete quality checklist'];

    let deptIds: string[] = [];
    if (data.departmentIds && data.departmentIds.length > 0) {
      deptIds = data.departmentIds;
    } else {
      const rows = await this.db.select({ id: departments.id }).from(departments).where(eq(departments.isActive, true));
      deptIds = rows.map((d) => d.id);
    }

    const taskRows: NewQualityEventTaskRow[] = [];
    for (const deptId of deptIds) {
      for (const title of template) {
        taskRows.push({
          id: newId(),
          eventId: created.id,
          departmentId: deptId,
          title,
          description: null,
          isCompleted: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }
    }
    if (taskRows.length > 0) {
      await this.db.insert(qualityEventTasks).values(taskRows);
    }

    return created;
  }

  async update(id: string, data: Partial<{ title: string; description: string; isActive: boolean; isArchived: boolean; endDate: string }>) {
    await this.findById(id);
    const patch: Partial<NewQualityEventRow> = { updatedAt: new Date() };
    if (data.title !== undefined) patch.title = data.title;
    if (data.description !== undefined) patch.description = data.description;
    if (data.isActive !== undefined) patch.isActive = data.isActive;
    if (data.isArchived !== undefined) patch.isArchived = data.isArchived;
    if (data.endDate !== undefined) patch.endDate = data.endDate ? new Date(data.endDate) : null;

    const [updated] = await this.db.update(qualityEvents).set(patch).where(eq(qualityEvents.id, id)).returning();
    return updated;
  }

  async delete(id: string) {
    await this.findById(id);
    await this.db.delete(qualityEvents).where(eq(qualityEvents.id, id));
    return { success: true as const };
  }

  async getTasks(eventId: string, departmentId?: string) {
    await this.findById(eventId);
    const conditions = [eq(qualityEventTasks.eventId, eventId)];
    if (departmentId) conditions.push(eq(qualityEventTasks.departmentId, departmentId));
    return this.db
      .select()
      .from(qualityEventTasks)
      .where(and(...conditions))
      .orderBy(asc(qualityEventTasks.departmentId), asc(qualityEventTasks.createdAt));
  }

  async completeTask(eventId: string, taskId: string, userId: string, userRole: string, isCompleted: boolean) {
    await this.findById(eventId);
    const [task] = await this.db
      .select()
      .from(qualityEventTasks)
      .where(and(eq(qualityEventTasks.id, taskId), eq(qualityEventTasks.eventId, eventId)))
      .limit(1);
    if (!task) throw new NotFoundException('Task not found');

    // Department in-charges may only update their own department; admins any.
    if (userRole !== 'ADMIN' && userRole !== 'STAFF') {
      throw new ForbiddenException('Not authorized');
    }

    const [updated] = await this.db
      .update(qualityEventTasks)
      .set({
        isCompleted,
        completedBy: isCompleted ? userId : null,
        completedAt: isCompleted ? new Date() : null,
        updatedAt: new Date(),
      })
      .where(eq(qualityEventTasks.id, taskId))
      .returning();
    return updated;
  }

  async getProgress(eventId: string) {
    await this.findById(eventId);
    const tasks = await this.db
      .select()
      .from(qualityEventTasks)
      .where(eq(qualityEventTasks.eventId, eventId));

    const byDept = new Map<string, { total: number; completed: number }>();
    for (const t of tasks) {
      const cur = byDept.get(t.departmentId) ?? { total: 0, completed: 0 };
      cur.total += 1;
      if (t.isCompleted) cur.completed += 1;
      byDept.set(t.departmentId, cur);
    }

    const deptIds = [...byDept.keys()];
    const depts = deptIds.length
      ? await this.db.select().from(departments).where(inArray(departments.id, deptIds))
      : [];
    const nameMap = new Map(depts.map((d) => [d.id, d.name]));

    return deptIds.map((id) => ({
      departmentId: id,
      departmentName: nameMap.get(id) ?? id,
      total: byDept.get(id)!.total,
      completed: byDept.get(id)!.completed,
    }));
  }
}
