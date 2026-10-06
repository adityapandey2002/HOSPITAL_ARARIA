import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { departments, doctors, timeSlots } from '../../common/drizzle/schema';
import { eq, and, desc, asc, sql, count } from 'drizzle-orm';

@Injectable()
export class DepartmentsService {
  constructor(
    @Inject('DRIZZLE') private db: any,
  ) {}

  async findAll(pagination: any) {
    const { page = 1, limit = 50, sortBy = 'name', sortOrder = 'asc' } = pagination;
    const offset = (page - 1) * limit;

    const sortColumn = departments[sortBy as keyof typeof departments];
    const orderBy = sortOrder === 'asc' ? asc(sortColumn) : desc(sortColumn);

    const [departmentsData, totalResult] = await Promise.all([
      this.db
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
        .limit(50)
        .offset(offset),
      this.db
        .select({ count: count() })
        .from(departments)
        .where(eq(departments.isActive, true)),
    ]);

    const total = totalResult[0]?.count || 0;

    return {
      data: departmentsData,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async findById(id: string) {
    const result = await this.db
      .select({
        id: departments.id,
        name: departments.name,
        description: departments.description,
        icon: departments.icon,
        imageUrl: departments.imageUrl,
        isActive: departments.isActive,
        createdAt: departments.createdAt,
        updatedAt: departments.updatedAt,
      })
      .from(departments)
      .where(eq(departments.id, id))
      .limit(1);

    if (!result[0]) throw new Error('Department not found');

    // Get doctors for this department
    const doctorsData = await this.db
      .select({
        id: doctors.id,
        name: doctors.name,
        specialization: doctors.specialization,
      })
      .from(doctors)
      .where(and(eq(doctors.departmentId, id), eq(doctors.isActive, true)));

    // Get available time slots for doctors in this department
    const doctorIds = doctorsData.map((d: any) => d.id);
    let timeSlotsData: any[] = [];
    if (doctorIds.length > 0) {
      timeSlotsData = await this.db
        .select({
          doctorId: timeSlots.doctorId,
          dayOfWeek: timeSlots.dayOfWeek,
          startTime: timeSlots.startTime,
          endTime: timeSlots.endTime,
        })
        .from(timeSlots)
        .where(and(
          eq(timeSlots.isAvailable, true),
          sql`${timeSlots.doctorId} IN (${doctorIds.join(',')})`
        ));
    }

    return {
      ...result[0],
      doctors: doctorsData,
      timeSlots: timeSlotsData,
    };
  }

  async create(data: any) {
    const existing = await this.db
      .select({ id: departments.id })
      .from(departments)
      .where(eq(departments.name, data.name))
      .limit(1);

    if (existing[0]) throw new Error('Department already exists');

    const result = await this.db
      .insert(departments)
      .values(data)
      .returning();

    return result[0];
  }

  async update(id: string, data: any) {
    await this.findById(id);
    const result = await this.db
      .update(departments)
      .set(data)
      .where(eq(departments.id, id))
      .returning();
    return result[0];
  }

  async delete(id: string) {
    await this.findById(id);
    await this.db.delete(departments).where(eq(departments.id, id));
    return { success: true };
  }
}