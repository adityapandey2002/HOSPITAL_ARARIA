import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { and, asc, count, desc, eq, inArray, ne } from 'drizzle-orm';
import type { AnyPgColumn } from 'drizzle-orm/pg-core';

import { PaginationDto } from '../../common/dto/pagination.dto';
import { DRIZZLE, type DrizzleDb } from '../../common/drizzle/drizzle.module';
import { newId } from '../../common/drizzle/id';
import {
  departments,
  doctors,
  timeSlots,
  type DepartmentRow,
  type NewDepartmentRow,
} from '../../common/drizzle/schema';

const SORTABLE: Record<string, AnyPgColumn> = {
  name: departments.name,
  createdAt: departments.createdAt,
  updatedAt: departments.updatedAt,
};

@Injectable()
export class DepartmentsService {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDb) {}

  /**
   * Public department directory. Returns one row per active department with a
   * live doctor count, ordered by `sortBy` and paginated.
   */
  async findAll(pagination: PaginationDto) {
    const page = pagination.page ?? 1;
    const limit = pagination.limit ?? 50;
    const offset = (page - 1) * limit;
    const orderBy =
      pagination.sortOrder === 'asc'
        ? asc(SORTABLE[pagination.sortBy ?? 'name'] ?? departments.name)
        : desc(SORTABLE[pagination.sortBy ?? 'name'] ?? departments.name);

    const rows = await this.db
      .select({
        id: departments.id,
        name: departments.name,
        description: departments.description,
        icon: departments.icon,
        imageUrl: departments.imageUrl,
        isActive: departments.isActive,
        createdAt: departments.createdAt,
        updatedAt: departments.updatedAt,
        doctorCount: count(doctors.id),
      })
      .from(departments)
      .leftJoin(doctors, and(eq(doctors.departmentId, departments.id), eq(doctors.isActive, true)))
      .where(eq(departments.isActive, true))
      .groupBy(departments.id)
      .orderBy(orderBy)
      .limit(limit)
      .offset(offset);

    const [totals] = await this.db
      .select({ value: count() })
      .from(departments)
      .where(eq(departments.isActive, true));

    const total = totals?.value ?? 0;

    return {
      data: rows,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  /** Department detail plus its active doctors and their bookable slots. */
  async findById(id: string) {
    const [department] = await this.db.select().from(departments).where(eq(departments.id, id)).limit(1);
    if (!department) throw new NotFoundException('Department not found');

    const staff = await this.db
      .select({
        id: doctors.id,
        name: doctors.name,
        specialization: doctors.specialization,
      })
      .from(doctors)
      .where(and(eq(doctors.departmentId, id), eq(doctors.isActive, true)));

    const doctorIds = staff.map((doctor) => doctor.id);
    const slots =
      doctorIds.length === 0
        ? []
        : await this.db
            .select({
              doctorId: timeSlots.doctorId,
              dayOfWeek: timeSlots.dayOfWeek,
              startTime: timeSlots.startTime,
              endTime: timeSlots.endTime,
            })
            .from(timeSlots)
            .where(and(eq(timeSlots.isAvailable, true), inArray(timeSlots.doctorId, doctorIds)));

    return { ...department, doctors: staff, timeSlots: slots };
  }

  async create(data: NewDepartmentRow): Promise<DepartmentRow> {
    const existing = await this.db
      .select({ id: departments.id })
      .from(departments)
      .where(eq(departments.name, data.name))
      .limit(1);

    if (existing.length > 0) throw new ConflictException('Department already exists');

    const [created] = await this.db
      .insert(departments)
      .values({ ...data, id: data.id ?? newId() })
      .returning();

    return created;
  }

  async update(id: string, data: Partial<NewDepartmentRow>): Promise<DepartmentRow> {
    await this.findById(id);

    if (data.name) {
      const clash = await this.db
        .select({ id: departments.id })
        .from(departments)
        .where(and(eq(departments.name, data.name), ne(departments.id, id)))
        .limit(1);
      if (clash.length > 0) throw new ConflictException('Department already exists');
    }

    const [updated] = await this.db
      .update(departments)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(departments.id, id))
      .returning();

    return updated;
  }

  async delete(id: string): Promise<{ success: true }> {
    await this.findById(id);
    await this.db.delete(departments).where(eq(departments.id, id));
    return { success: true };
  }
}