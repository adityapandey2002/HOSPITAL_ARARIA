import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { PaginationDto } from '../../common/dto/pagination.dto';

@Injectable()
export class DoctorsService {
  constructor(private prisma: PrismaService) {}

  async findAll(pagination: PaginationDto, filters?: { departmentId?: string; isActive?: boolean; search?: string }) {
    const { page = 1, limit = 10, sortBy = 'name', sortOrder = 'asc' } = pagination;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (filters?.departmentId) where.departmentId = filters.departmentId;
    if (filters?.isActive !== undefined) where.isActive = filters.isActive;
    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { specialization: { contains: filters.search, mode: 'insensitive' } },
        { qualification: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const [doctors, total] = await Promise.all([
      this.prisma.doctor.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          department: { select: { id: true, name: true } },
          user: { select: { id: true, email: true, phone: true } },
          timeSlots: { where: { isAvailable: true } },
        },
      }),
      this.prisma.doctor.count({ where }),
    ]);

    return {
      data: doctors,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async findById(id: string) {
    const doctor = await this.prisma.doctor.findUnique({
      where: { id },
      include: {
        department: true,
        user: { select: { id: true, email: true, phone: true } },
        timeSlots: { orderBy: { dayOfWeek: 'asc' } },
      },
    });

    if (!doctor) throw new NotFoundException('Doctor not found');
    return doctor;
  }

  async create(data: any) {
    // Check if user exists and is not already a doctor
    const user = await this.prisma.user.findUnique({ where: { id: data.userId } });
    if (!user) throw new NotFoundException('User not found');
    if (user.role !== 'DOCTOR') {
      await this.prisma.user.update({ where: { id: data.userId }, data: { role: 'DOCTOR' } });
    }

    // Check if doctor profile already exists
    const existing = await this.prisma.doctor.findUnique({ where: { userId: data.userId } });
    if (existing) throw new ConflictException('Doctor profile already exists for this user');

    return this.prisma.doctor.create({
      data: {
        userId: data.userId,
        name: data.name,
        specialization: data.specialization,
        qualification: data.qualification,
        experience: data.experience,
        hprId: data.hprId,
        departmentId: data.departmentId,
        consultationFee: data.consultationFee,
        languages: data.languages || [],
        bio: data.bio,
        imageUrl: data.imageUrl,
      },
      include: { department: true },
    });
  }

  async update(id: string, data: any) {
    await this.findById(id);
    return this.prisma.doctor.update({ where: { id }, data, include: { department: true } });
  }

  async delete(id: string) {
    await this.findById(id);
    return this.prisma.doctor.delete({ where: { id } });
  }

  async getAvailableSlots(doctorId: string, date: Date) {
    const dayOfWeek = date.getDay();
    return this.prisma.timeSlot.findMany({
      where: { doctorId, dayOfWeek, isAvailable: true },
      orderBy: { startTime: 'asc' },
    });
  }
}