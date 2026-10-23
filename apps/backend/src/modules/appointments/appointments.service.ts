import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  ForbiddenException,
  Inject,
} from '@nestjs/common';
import { and, asc, count, desc, eq, gte, inArray, lt } from 'drizzle-orm';
import type { AnyPgColumn } from 'drizzle-orm/pg-core';
import { AppointmentStatus, AppointmentType, isStaffRole } from '@dh-araria/shared';

import { PaginationDto } from '../../common/dto/pagination.dto';
import { DRIZZLE, type DrizzleDb } from '../../common/drizzle/drizzle.module';
import { newId } from '../../common/drizzle/id';
import { appointments, departments, doctors, timeSlots, users } from '../../common/drizzle/schema';
import { addUtcDays, startOfUtcDay } from '../../common/utils/date';

/** Allow-listed sort targets — `sortBy` arrives from the query string. */
const SORTABLE: Record<string, AnyPgColumn> = {
  appointmentDate: appointments.appointmentDate,
  createdAt: appointments.createdAt,
  status: appointments.status,
  tokenNumber: appointments.tokenNumber,
};

/** Statuses that occupy a slot. Cancelled / completed rows do not. */
const ACTIVE_STATUSES: AppointmentStatus[] = [
  AppointmentStatus.PENDING,
  AppointmentStatus.CONFIRMED,
];

/**
 * Every appointment response uses this one shape. Prisma previously returned
 * three different projections, one of which (`patient: true`) leaked the
 * password hash — so a single projection is both simpler and safer.
 */
const APPOINTMENT_DETAIL = {
  id: appointments.id,
  patientId: appointments.patientId,
  doctorId: appointments.doctorId,
  departmentId: appointments.departmentId,
  appointmentDate: appointments.appointmentDate,
  startTime: appointments.startTime,
  endTime: appointments.endTime,
  status: appointments.status,
  type: appointments.type,
  reason: appointments.reason,
  notes: appointments.notes,
  abhaId: appointments.abhaId,
  tokenNumber: appointments.tokenNumber,
  createdAt: appointments.createdAt,
  updatedAt: appointments.updatedAt,
  patient: {
    id: users.id,
    name: users.name,
    email: users.email,
    phone: users.phone,
    abhaId: users.abhaId,
  },
  doctor: {
    id: doctors.id,
    name: doctors.name,
    specialization: doctors.specialization,
    departmentId: doctors.departmentId,
    consultationFee: doctors.consultationFee,
  },
  department: {
    id: departments.id,
    name: departments.name,
  },
} as const;

export interface AppointmentFilters {
  patientId?: string;
  doctorId?: string;
  departmentId?: string;
  status?: AppointmentStatus;
  type?: AppointmentType;
  /** Inclusive lower bound (calendar day). */
  dateFrom?: string | Date;
  /** Inclusive upper bound (calendar day). */
  dateTo?: string | Date;
}

export interface CreateAppointmentInput {
  doctorId: string;
  appointmentDate: string | Date;
  startTime: string;
  endTime?: string;
  type?: AppointmentType;
  reason?: string;
  notes?: string;
  abhaId?: string;
}

export interface UpdateAppointmentInput {
  appointmentDate?: string | Date;
  startTime?: string;
  endTime?: string;
  status?: AppointmentStatus;
  type?: AppointmentType;
  reason?: string;
  notes?: string;
  abhaId?: string;
}

@Injectable()
export class AppointmentsService {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDb) {}

  async findAll(pagination: PaginationDto, filters: AppointmentFilters = {}) {
    const page = pagination.page ?? 1;
    const limit = pagination.limit ?? 10;
    const offset = (page - 1) * limit;
    const column = SORTABLE[pagination.sortBy ?? 'appointmentDate'] ?? appointments.appointmentDate;
    const orderBy = pagination.sortOrder === 'asc' ? asc(column) : desc(column);

    const conditions = [];
    if (filters.patientId) conditions.push(eq(appointments.patientId, filters.patientId));
    if (filters.doctorId) conditions.push(eq(appointments.doctorId, filters.doctorId));
    if (filters.departmentId) conditions.push(eq(appointments.departmentId, filters.departmentId));
    if (filters.status) conditions.push(eq(appointments.status, filters.status));
    if (filters.type) conditions.push(eq(appointments.type, filters.type));

    // Half-open day windows: `dateTo` is inclusive for the caller but expressed
    // as `< next midnight`, so the whole final day is covered.
    if (filters.dateFrom) {
      conditions.push(gte(appointments.appointmentDate, startOfUtcDay(filters.dateFrom)));
    }
    if (filters.dateTo) {
      conditions.push(
        lt(appointments.appointmentDate, addUtcDays(startOfUtcDay(filters.dateTo), 1))
      );
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const [rows, totals] = await Promise.all([
      this.db
        .select(APPOINTMENT_DETAIL)
        .from(appointments)
        .innerJoin(users, eq(appointments.patientId, users.id))
        .innerJoin(doctors, eq(appointments.doctorId, doctors.id))
        .innerJoin(departments, eq(appointments.departmentId, departments.id))
        .where(where)
        .orderBy(orderBy)
        .limit(limit)
        .offset(offset),
      this.db.select({ value: count() }).from(appointments).where(where),
    ]);

    const total = totals[0]?.value ?? 0;
    return { data: rows, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async findById(id: string) {
    const [appointment] = await this.db
      .select(APPOINTMENT_DETAIL)
      .from(appointments)
      .innerJoin(users, eq(appointments.patientId, users.id))
      .innerJoin(doctors, eq(appointments.doctorId, doctors.id))
      .innerJoin(departments, eq(appointments.departmentId, departments.id))
      .where(eq(appointments.id, id))
      .limit(1);

    if (!appointment) throw new NotFoundException('Appointment not found');
    return appointment;
  }

  /**
   * Books a slot.
   *
   * The whole invariant runs inside one transaction: an inactive doctor, an
   * unavailable slot, a double-booking and the token number are all checked and
   * written together. `SELECT ... FOR UPDATE` on the doctor row serialises
   * concurrent bookings for the same doctor, which is what makes the
   * double-booking check meaningful — without it two requests can both read
   * "no conflict" and both insert.
   */
  async create(data: CreateAppointmentInput, patientId: string) {
    const appointmentDate = startOfUtcDay(data.appointmentDate);
    const dayOfWeek = appointmentDate.getUTCDay();

    const createdId = await this.db.transaction(async (tx) => {
      const [doctor] = await tx
        .select({
          id: doctors.id,
          departmentId: doctors.departmentId,
          isActive: doctors.isActive,
        })
        .from(doctors)
        .where(eq(doctors.id, data.doctorId))
        .for('update');

      if (!doctor || !doctor.isActive) {
        throw new NotFoundException('Doctor not found or inactive');
      }

      const [slot] = await tx
        .select({ id: timeSlots.id })
        .from(timeSlots)
        .where(
          and(
            eq(timeSlots.doctorId, data.doctorId),
            eq(timeSlots.dayOfWeek, dayOfWeek),
            eq(timeSlots.startTime, data.startTime),
            eq(timeSlots.isAvailable, true)
          )
        )
        .limit(1);

      if (!slot) throw new BadRequestException('Selected time slot is not available');

      const active = and(
        eq(appointments.doctorId, data.doctorId),
        eq(appointments.appointmentDate, appointmentDate),
        inArray(appointments.status, ACTIVE_STATUSES)
      );

      const [conflicting] = await tx
        .select({ id: appointments.id })
        .from(appointments)
        .where(and(active, eq(appointments.startTime, data.startTime)))
        .limit(1);

      if (conflicting) throw new ConflictException('Time slot already booked');

      const [totals] = await tx.select({ value: count() }).from(appointments).where(active);

      const [created] = await tx
        .insert(appointments)
        .values({
          id: newId(),
          patientId,
          doctorId: data.doctorId,
          departmentId: doctor.departmentId,
          appointmentDate,
          startTime: data.startTime,
          endTime: data.endTime ?? this.calculateEndTime(data.startTime, 20),
          status: AppointmentStatus.PENDING,
          type: data.type ?? AppointmentType.OPD,
          reason: data.reason,
          notes: data.notes,
          abhaId: data.abhaId,
          tokenNumber: (totals?.value ?? 0) + 1,
        })
        .returning({ id: appointments.id });

      return created.id;
    });

    return this.findById(createdId);
  }

  async update(id: string, data: UpdateAppointmentInput) {
    await this.findById(id);

    const patch: Record<string, unknown> = { ...data };
    if (data.appointmentDate) {
      patch.appointmentDate = startOfUtcDay(data.appointmentDate);
    }
    patch.updatedAt = new Date();

    const [updated] = await this.db
      .update(appointments)
      .set(patch)
      .where(eq(appointments.id, id))
      .returning({ id: appointments.id });

    return this.findById(updated.id);
  }

  async updateStatus(id: string, status: AppointmentStatus) {
    await this.findById(id);

    await this.db
      .update(appointments)
      .set({ status, updatedAt: new Date() })
      .where(eq(appointments.id, id));

    return this.findById(id);
  }

  async cancel(id: string, userId: string, userRole: string) {
    const appointment = await this.findById(id);
    if (appointment.patientId !== userId && !isStaffRole(userRole) && userRole !== 'DOCTOR') {
      throw new ForbiddenException('Not authorized to cancel this appointment');
    }
    return this.updateStatus(id, AppointmentStatus.CANCELLED);
  }

  async delete(id: string) {
    await this.findById(id);
    await this.db.delete(appointments).where(eq(appointments.id, id));
    return { success: true };
  }

  async getMyAppointments(patientId: string, pagination: PaginationDto) {
    return this.findAll(pagination, { patientId });
  }

  async getDoctorAppointments(doctorId: string, pagination: PaginationDto, date?: string) {
    const filters: AppointmentFilters = { doctorId };
    if (date) {
      // One calendar day, expressed as an inclusive range. The previous version
      // passed the same instant as both bounds, so it matched only appointments
      // stored at exactly midnight.
      filters.dateFrom = date;
      filters.dateTo = date;
    }
    return this.findAll(pagination, filters);
  }

  private calculateEndTime(startTime: string, durationMinutes: number): string {
    const [hours, minutes] = startTime.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes + durationMinutes;
    const endHours = Math.floor(totalMinutes / 60) % 24;
    const endMinutes = totalMinutes % 60;
    return `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`;
  }
}
