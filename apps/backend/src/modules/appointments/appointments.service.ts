import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { AppointmentStatus, AppointmentType } from '@dh-araria/shared/types';

@Injectable()
export class AppointmentsService {
  constructor(private prisma: PrismaService) {}

  async findAll(pagination: PaginationDto, filters?: any) {
    const { page = 1, limit = 10, sortBy = 'appointmentDate', sortOrder = 'desc' } = pagination;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (filters?.patientId) where.patientId = filters.patientId;
    if (filters?.doctorId) where.doctorId = filters.doctorId;
    if (filters?.departmentId) where.departmentId = filters.departmentId;
    if (filters?.status) where.status = filters.status;
    if (filters?.type) where.type = filters.type;
    if (filters?.dateFrom || filters?.dateTo) {
      where.appointmentDate = {};
      if (filters.dateFrom) where.appointmentDate.gte = new Date(filters.dateFrom);
      if (filters.dateTo) where.appointmentDate.lte = new Date(filters.dateTo);
    }

    const [appointments, total] = await Promise.all([
      this.prisma.appointment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          patient: { select: { id: true, name: true, email: true, phone: true } },
          doctor: { select: { id: true, name: true, specialization: true, departmentId: true } },
          department: { select: { id: true, name: true } },
        },
      }),
      this.prisma.appointment.count({ where }),
    ]);

    return { data: appointments, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async findById(id: string) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id },
      include: {
        patient: { select: { id: true, name: true, email: true, phone: true, abhaId: true } },
        doctor: { select: { id: true, name: true, specialization: true, departmentId: true, consultationFee: true } },
        department: { select: { id: true, name: true } },
      },
    });
    if (!appointment) throw new NotFoundException('Appointment not found');
    return appointment;
  }

  async create(data: any, patientId: string) {
    // Check if doctor exists and is active
    const doctor = await this.prisma.doctor.findUnique({
      where: { id: data.doctorId },
      include: { timeSlots: true, department: true },
    });
    if (!doctor || !doctor.isActive) throw new NotFoundException('Doctor not found or inactive');

    // Check if time slot is available
    const appointmentDate = new Date(data.appointmentDate);
    const dayOfWeek = appointmentDate.getDay();
    const timeSlot = doctor.timeSlots.find(
      (slot) => slot.dayOfWeek === dayOfWeek && slot.startTime === data.startTime && slot.isAvailable
    );
    if (!timeSlot) throw new BadRequestException('Selected time slot is not available');

    // Check for conflicting appointments
    const conflicting = await this.prisma.appointment.findFirst({
      where: {
        doctorId: data.doctorId,
        appointmentDate,
        startTime: data.startTime,
        status: { in: [AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED] },
      },
    });
    if (conflicting) throw new ConflictException('Time slot already booked');

    // Generate token number
    const todaysAppointments = await this.prisma.appointment.count({
      where: {
        doctorId: data.doctorId,
        appointmentDate,
        status: { in: [AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED] },
      },
    });

    return this.prisma.appointment.create({
      data: {
        patientId,
        doctorId: data.doctorId,
        departmentId: doctor.departmentId,
        appointmentDate,
        startTime: data.startTime,
        endTime: data.endTime || this.calculateEndTime(data.startTime, 20),
        status: AppointmentStatus.PENDING,
        type: data.type || AppointmentType.OPD,
        reason: data.reason,
        notes: data.notes,
        abhaId: data.abhaId,
        tokenNumber: todaysAppointments + 1,
      },
      include: {
        patient: { select: { id: true, name: true, email: true, phone: true } },
        doctor: { select: { id: true, name: true, specialization: true } },
        department: { select: { id: true, name: true } },
      },
    });
  }

  async update(id: string, data: any) {
    await this.findById(id);
    return this.prisma.appointment.update({ where: { id }, data });
  }

  async updateStatus(id: string, status: AppointmentStatus) {
    return this.prisma.appointment.update({
      where: { id },
      data: { status },
      include: { patient: true, doctor: true, department: true },
    });
  }

  async cancel(id: string, userId: string, userRole: string) {
    const appointment = await this.findById(id);
    if (appointment.patientId !== userId && userRole !== 'ADMIN' && userRole !== 'DOCTOR') {
      throw new BadRequestException('Not authorized to cancel this appointment');
    }
    return this.updateStatus(id, AppointmentStatus.CANCELLED);
  }

  async delete(id: string) {
    await this.findById(id);
    return this.prisma.appointment.delete({ where: { id } });
  }

  async getMyAppointments(patientId: string, pagination: PaginationDto) {
    return this.findAll(pagination, { patientId });
  }

  async getDoctorAppointments(doctorId: string, pagination: PaginationDto, date?: string) {
    const filters: any = { doctorId };
    if (date) {
      const appointmentDate = new Date(date);
      filters.dateFrom = appointmentDate;
      filters.dateTo = appointmentDate;
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