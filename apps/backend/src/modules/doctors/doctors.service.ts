import { ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, asc, count, desc, eq, ilike, inArray, ne, or } from 'drizzle-orm';
import type { AnyPgColumn } from 'drizzle-orm/pg-core';

import { PaginationDto } from '../../common/dto/pagination.dto';
import { DRIZZLE, type DrizzleDb } from '../../common/drizzle/drizzle.module';
import { newId } from '../../common/drizzle/id';
import { departments, doctors, timeSlots, users } from '../../common/drizzle/schema';
import { UsersService } from '../users/users.service';

/** Allow-listed sort targets — `sortBy` arrives from the query string. */
const SORTABLE: Record<string, AnyPgColumn> = {
  name: doctors.name,
  specialization: doctors.specialization,
  experience: doctors.experience,
  consultationFee: doctors.consultationFee,
  rating: doctors.rating,
  createdAt: doctors.createdAt,
};

/** Doctor columns returned on both the list and detail endpoints. */
const DOCTOR_COLUMNS = {
  id: doctors.id,
  userId: doctors.userId,
  name: doctors.name,
  specialization: doctors.specialization,
  qualification: doctors.qualification,
  experience: doctors.experience,
  hprId: doctors.hprId,
  departmentId: doctors.departmentId,
  consultationFee: doctors.consultationFee,
  rating: doctors.rating,
  reviewCount: doctors.reviewCount,
  languages: doctors.languages,
  bio: doctors.bio,
  imageUrl: doctors.imageUrl,
  isActive: doctors.isActive,
  createdAt: doctors.createdAt,
  updatedAt: doctors.updatedAt,
};

const DEPARTMENT_SUMMARY = {
  id: departments.id,
  name: departments.name,
} as const;

const DEPARTMENT_DETAIL = {
  ...DEPARTMENT_SUMMARY,
  description: departments.description,
  icon: departments.icon,
  imageUrl: departments.imageUrl,
  isActive: departments.isActive,
  createdAt: departments.createdAt,
  updatedAt: departments.updatedAt,
};

const USER_SUMMARY = {
  id: users.id,
  email: users.email,
  phone: users.phone,
} as const;

export interface DoctorFilters {
  departmentId?: string;
  isActive?: boolean;
  search?: string;
}

export interface CreateDoctorInput {
  userId: string;
  name: string;
  specialization: string;
  qualification: string;
  experience: number;
  hprId?: string;
  departmentId: string;
  consultationFee: number;
  languages?: string[];
  bio?: string;
  imageUrl?: string;
}

export interface UpdateDoctorInput {
  name?: string;
  specialization?: string;
  qualification?: string;
  experience?: number;
  hprId?: string;
  departmentId?: string;
  consultationFee?: number;
  languages?: string[];
  bio?: string;
  imageUrl?: string;
  isActive?: boolean;
}

@Injectable()
export class DoctorsService {
  constructor(
    @Inject(DRIZZLE) private readonly db: DrizzleDb,
    private readonly usersService: UsersService
  ) {}

  async findAll(pagination: PaginationDto, filters: DoctorFilters = {}) {
    const page = pagination.page ?? 1;
    const limit = pagination.limit ?? 10;
    const offset = (page - 1) * limit;
    const column = SORTABLE[pagination.sortBy ?? 'name'] ?? doctors.name;
    const orderBy = pagination.sortOrder === 'asc' ? asc(column) : desc(column);

    const conditions = [];
    if (filters.departmentId) conditions.push(eq(doctors.departmentId, filters.departmentId));
    if (filters.isActive !== undefined) conditions.push(eq(doctors.isActive, filters.isActive));
    if (filters.search) {
      const term = `%${filters.search}%`;
      conditions.push(
        or(
          ilike(doctors.name, term),
          ilike(doctors.specialization, term),
          ilike(doctors.qualification, term)
        )
      );
    }
    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const [rows, totals] = await Promise.all([
      this.db
        .select({
          ...DOCTOR_COLUMNS,
          department: DEPARTMENT_SUMMARY,
          user: USER_SUMMARY,
        })
        .from(doctors)
        .innerJoin(departments, eq(doctors.departmentId, departments.id))
        .innerJoin(users, eq(doctors.userId, users.id))
        .where(where)
        .orderBy(orderBy)
        .limit(limit)
        .offset(offset),
      this.db.select({ value: count() }).from(doctors).where(where),
    ]);

    const total = totals[0]?.value ?? 0;

    // One extra query for the whole page instead of a correlated subquery per
    // doctor. Slots are attached to their doctor before the page is returned.
    const doctorIds = rows.map((row) => row.id);
    const slots =
      doctorIds.length === 0
        ? []
        : await this.db
            .select()
            .from(timeSlots)
            .where(and(inArray(timeSlots.doctorId, doctorIds), eq(timeSlots.isAvailable, true)))
            .orderBy(asc(timeSlots.dayOfWeek), asc(timeSlots.startTime));

    const slotsByDoctor = new Map<string, typeof slots>();
    for (const slot of slots) {
      const list = slotsByDoctor.get(slot.doctorId) ?? [];
      list.push(slot);
      slotsByDoctor.set(slot.doctorId, list);
    }

    return {
      data: rows.map((row) => ({ ...row, timeSlots: slotsByDoctor.get(row.id) ?? [] })),
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async findById(id: string) {
    const [doctor] = await this.db
      .select({
        ...DOCTOR_COLUMNS,
        department: DEPARTMENT_DETAIL,
        user: USER_SUMMARY,
      })
      .from(doctors)
      .innerJoin(departments, eq(doctors.departmentId, departments.id))
      .innerJoin(users, eq(doctors.userId, users.id))
      .where(eq(doctors.id, id))
      .limit(1);

    if (!doctor) throw new NotFoundException('Doctor not found');

    const slots = await this.db
      .select()
      .from(timeSlots)
      .where(eq(timeSlots.doctorId, id))
      .orderBy(asc(timeSlots.dayOfWeek), asc(timeSlots.startTime));

    return { ...doctor, timeSlots: slots };
  }

  async create(data: CreateDoctorInput) {
    const user = await this.usersService.findByIdOrNull(data.userId);
    if (!user) throw new NotFoundException('User not found');

    if (user.role !== 'DOCTOR') {
      await this.usersService.update(data.userId, { role: 'DOCTOR' });
    }

    const [existing] = await this.db
      .select({ id: doctors.id })
      .from(doctors)
      .where(eq(doctors.userId, data.userId))
      .limit(1);
    if (existing) throw new ConflictException('Doctor profile already exists for this user');

    if (data.hprId) {
      const [hprClash] = await this.db
        .select({ id: doctors.id })
        .from(doctors)
        .where(eq(doctors.hprId, data.hprId))
        .limit(1);
      if (hprClash) throw new ConflictException('HPR ID already registered to another doctor');
    }

    const [created] = await this.db
      .insert(doctors)
      .values({
        id: newId(),
        userId: data.userId,
        name: data.name,
        specialization: data.specialization,
        qualification: data.qualification,
        experience: data.experience,
        hprId: data.hprId,
        departmentId: data.departmentId,
        consultationFee: data.consultationFee,
        languages: data.languages ?? [],
        bio: data.bio,
        imageUrl: data.imageUrl,
      })
      .returning({ id: doctors.id });

    return this.findById(created.id);
  }

  async update(id: string, data: UpdateDoctorInput) {
    await this.findById(id);

    if (data.hprId) {
      const [clash] = await this.db
        .select({ id: doctors.id })
        .from(doctors)
        .where(and(eq(doctors.hprId, data.hprId), ne(doctors.id, id)))
        .limit(1);
      if (clash) throw new ConflictException('HPR ID already registered to another doctor');
    }

    await this.db
      .update(doctors)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(doctors.id, id));

    return this.findById(id);
  }

  async delete(id: string) {
    await this.findById(id);
    const [deleted] = await this.db.delete(doctors).where(eq(doctors.id, id)).returning();
    return deleted;
  }

  async getAvailableSlots(doctorId: string, date: Date) {
    const dayOfWeek = date.getUTCDay();
    return this.db
      .select()
      .from(timeSlots)
      .where(
        and(
          eq(timeSlots.doctorId, doctorId),
          eq(timeSlots.dayOfWeek, dayOfWeek),
          eq(timeSlots.isAvailable, true)
        )
      )
      .orderBy(asc(timeSlots.startTime));
  }
}
