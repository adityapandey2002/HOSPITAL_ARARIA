import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, asc, count, desc, eq, inArray } from 'drizzle-orm';
import { UserRole, isStaffRole } from '@dh-araria/shared';

import { PaginationDto } from '../../common/dto/pagination.dto';
import { DRIZZLE, type DrizzleDb } from '../../common/drizzle/drizzle.module';
import { newId } from '../../common/drizzle/id';
import {
  complaintViewers,
  departments,
  doctors,
  users,
  type DoctorRow,
  type NewDoctorRow,
} from '../../common/drizzle/schema';

import type {
  AssignDepartmentAccessDto,
  CreateDoctorDto,
  DepartmentAccessResponseDto,
  UpdateDoctorDto,
} from './dto/admin.dto';

type Select = typeof doctors.$inferSelect;
type Insert = typeof doctors.$inferInsert;

/**
 * Admin module: doctor management + department nodal officer access.
 *
 * - ADMIN can add/remove doctors to/from departments
 * - ADMIN can nominate STAFF users as nodal officers for departments
 *   (via complaint_viewers grants — same table as feedback access)
 * - Nodal officers see and update complaints only for their department
 */
@Injectable()
export class AdminService {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDb) {}

  // -------------------------------------------------------------------------
  // Doctor management
  // -------------------------------------------------------------------------

  async listDoctors(departmentId?: string) {
    const conditions = [];
    if (departmentId) {
      conditions.push(eq(doctors.departmentId, departmentId));
    }
    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const [rows, totals] = await Promise.all([
      this.db
        .select({
          id: doctors.id,
          name: doctors.name,
          specialization: doctors.specialization,
          qualification: doctors.qualification,
          experience: doctors.experience,
          consultationFee: doctors.consultationFee,
          rating: doctors.rating,
          reviewCount: doctors.reviewCount,
          hprId: doctors.hprId,
          departmentId: doctors.departmentId,
          departmentName: departments.name,
          languages: doctors.languages,
          bio: doctors.bio,
          imageUrl: doctors.imageUrl,
          isActive: doctors.isActive,
          createdAt: doctors.createdAt,
          updatedAt: doctors.updatedAt,
        })
        .from(doctors)
        .leftJoin(departments, eq(doctors.departmentId, departments.id))
        .where(where)
        .orderBy(asc(doctors.name)),
      this.db.select({ value: count() }).from(doctors).where(where),
    ]);

    return {
      data: rows,
      meta: { total: totals[0]?.value ?? 0 },
    };
  }

  async createDoctor(dto: CreateDoctorDto, createdBy: string): Promise<DoctorRow> {
    // Verify department exists
    const [department] = await this.db
      .select({ id: departments.id, name: departments.name })
      .from(departments)
      .where(eq(departments.id, dto.departmentId))
      .limit(1);

    if (!department) {
      throw new NotFoundException('Department not found');
    }

    // Verify email is not already in use
    const [existingUser] = await this.db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, dto.email))
      .limit(1);

    if (existingUser) {
      throw new BadRequestException('Email already in use');
    }

    const now = new Date();
    const languages = dto.languages ? JSON.parse(dto.languages) : ['English', 'Hindi'];
    const values: NewDoctorRow = {
      id: newId(),
      name: dto.name,
      specialization: dto.specialization,
      qualification: dto.qualification,
      experience: Number(dto.experience),
      hprId: dto.hprId ?? null,
      departmentId: dto.departmentId,
      consultationFee: dto.consultationFee ? Number(dto.consultationFee) : 0,
      rating: 0,
      reviewCount: 0,
      languages: Array.isArray(languages) ? languages : [languages],
      bio: dto.bio ?? null,
      imageUrl: null,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    } as Insert;

    // Create the user account for the doctor
    const [user] = await this.db
      .insert(users)
      .values({
        id: newId(),
        email: dto.email,
        password: '$2b$12$placeholder', // will be set via password reset
        name: dto.name,
        phone: dto.phone,
        role: dto.role ?? UserRole.DOCTOR,
        isActive: true,
        abhaId: null,
        createdAt: now,
        updatedAt: now,
      } as any)
      .returning({ id: users.id });

    values.userId = user.id;

    const [created] = await this.db.insert(doctors).values(values).returning();
    return created;
  }

  async updateDoctor(id: string, dto: UpdateDoctorDto): Promise<DoctorRow> {
    const [existing] = await this.db
      .select({ id: doctors.id })
      .from(doctors)
      .where(eq(doctors.id, id))
      .limit(1);

    if (!existing) {
      throw new NotFoundException('Doctor not found');
    }

    const updateData: Partial<Insert> = {
      updatedAt: new Date(),
    };

    if (dto.name) updateData.name = dto.name;
    if (dto.specialization) updateData.specialization = dto.specialization;
    if (dto.qualification) updateData.qualification = dto.qualification;
    if (dto.experience) updateData.experience = Number(dto.experience);
    if (dto.hprId !== undefined) updateData.hprId = dto.hprId;
    if (dto.departmentId) updateData.departmentId = dto.departmentId;
    if (dto.consultationFee !== undefined)
      updateData.consultationFee = Number(dto.consultationFee);
    if (dto.bio !== undefined) updateData.bio = dto.bio;
    if (dto.languages) {
      const parsed = JSON.parse(dto.languages);
      updateData.languages = Array.isArray(parsed) ? parsed : [parsed];
    }

    const [updated] = await this.db
      .update(doctors)
      .set(updateData)
      .where(eq(doctors.id, id))
      .returning();

    return updated;
  }

  async deleteDoctor(id: string): Promise<{ deleted: true }> {
    const [existing] = await this.db
      .select({ id: doctors.id })
      .from(doctors)
      .where(eq(doctors.id, id))
      .limit(1);

    if (!existing) {
      throw new NotFoundException('Doctor not found');
    }

    await this.db.delete(doctors).where(eq(doctors.id, id));
    return { deleted: true };
  }

  // -------------------------------------------------------------------------
  // Department nodal officer access (complaint_viewers grants)
  // -------------------------------------------------------------------------

  async listDepartmentAccess() {
    return this.db
      .select({
        id: complaintViewers.id,
        userId: complaintViewers.userId,
        userName: users.name,
        userEmail: users.email,
        departmentId: complaintViewers.departmentId,
        departmentName: departments.name,
        grantedBy: complaintViewers.grantedBy,
        createdAt: complaintViewers.createdAt,
      })
      .from(complaintViewers)
      .innerJoin(users, eq(complaintViewers.userId, users.id))
      .innerJoin(departments, eq(complaintViewers.departmentId, departments.id))
      .orderBy(desc(complaintViewers.createdAt));
  }

  async assignDepartmentAccess(
    dto: AssignDepartmentAccessDto,
    grantedBy: string
  ): Promise<DepartmentAccessResponseDto> {
    // Verify user exists and is STAFF or ADMIN
    const [user] = await this.db
      .select({ id: users.id, name: users.name, email: users.email, role: users.role })
      .from(users)
      .where(eq(users.id, dto.userId))
      .limit(1);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!isStaffRole(user.role)) {
      throw new BadRequestException('Only STAFF or ADMIN users can be nominated as nodal officers');
    }

    // Verify department exists
    const [department] = await this.db
      .select({ id: departments.id, name: departments.name })
      .from(departments)
      .where(eq(departments.id, dto.departmentId))
      .limit(1);

    if (!department) {
      throw new NotFoundException('Department not found');
    }

    const now = new Date();
    const [created] = await this.db
      .insert(complaintViewers)
      .values({
        id: newId(),
        userId: dto.userId,
        departmentId: dto.departmentId,
        grantedBy,
        createdAt: now,
      })
      .onConflictDoNothing()
      .returning();

    if (!created) {
      // Already exists — return current state
      const [existing] = await this.db
        .select({
          id: complaintViewers.id,
          userId: complaintViewers.userId,
          departmentId: complaintViewers.departmentId,
          grantedBy: complaintViewers.grantedBy,
          createdAt: complaintViewers.createdAt,
        })
        .from(complaintViewers)
        .where(
          and(
            eq(complaintViewers.userId, dto.userId),
            eq(complaintViewers.departmentId, dto.departmentId)
          )
        )
        .limit(1);

      if (!existing) {
        throw new BadRequestException('Failed to create access grant');
      }

      return {
        ...(existing as any),
        userName: user.name,
        userEmail: user.email,
        departmentName: department.name,
      } as DepartmentAccessResponseDto;
    }

    return {
      ...(created as any),
      userName: user.name,
      userEmail: user.email,
      departmentName: department.name,
    } as DepartmentAccessResponseDto;
  }

  async revokeDepartmentAccess(id: string): Promise<{ deleted: true }> {
    const [existing] = await this.db
      .select({ id: complaintViewers.id })
      .from(complaintViewers)
      .where(eq(complaintViewers.id, id))
      .limit(1);

    if (!existing) {
      throw new NotFoundException('Department access grant not found');
    }

    await this.db.delete(complaintViewers).where(eq(complaintViewers.id, id));
    return { deleted: true };
  }
}
