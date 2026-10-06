import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { GrievanceStatus, GrievanceCategory } from '@dh-araria/shared/types';

@Injectable()
export class GrievancesService {
  constructor(private prisma: PrismaService) {}

  async findAll(pagination: PaginationDto, filters?: any) {
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = pagination;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (filters?.userId) where.userId = filters.userId;
    if (filters?.status) where.status = filters.status;
    if (filters?.category) where.category = filters.category;
    if (filters?.assignedTo) where.assignedTo = filters.assignedTo;

    const [grievances, total] = await Promise.all([
      this.prisma.grievance.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          user: { select: { id: true, name: true, email: true, phone: true } },
          assignee: { select: { id: true, name: true, email: true } },
        },
      }),
      this.prisma.grievance.count({ where }),
    ]);

    return { data: grievances, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async findById(id: string) {
    const grievance = await this.prisma.grievance.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
        assignee: { select: { id: true, name: true, email: true } },
      },
    });
    if (!grievance) throw new NotFoundException('Grievance not found');
    return grievance;
  }

  async create(data: any, userId?: string) {
    return this.prisma.grievance.create({
      data: {
        userId,
        name: data.name,
        email: data.email,
        phone: data.phone,
        category: data.category,
        subject: data.subject,
        description: data.description,
        status: GrievanceStatus.SUBMITTED,
      },
      include: { user: { select: { id: true, name: true, email: true } } },
    });
  }

  async update(id: string, data: any, userId: string, userRole: string) {
    const grievance = await this.findById(id);
    
    // Check permissions
    if (userRole !== 'ADMIN' && userRole !== 'STAFF' && grievance.userId !== userId) {
      throw new ForbiddenException('Not authorized to update this grievance');
    }

    return this.prisma.grievance.update({
      where: { id },
      data,
      include: { user: true, assignee: true },
    });
  }

  async updateStatus(id: string, status: GrievanceStatus, userId: string, userRole: string, resolution?: string) {
    const grievance = await this.findById(id);
    
    if (userRole !== 'ADMIN' && userRole !== 'STAFF') {
      throw new ForbiddenException('Not authorized to update status');
    }

    return this.prisma.grievance.update({
      where: { id },
      data: { status, resolution, assignedTo: userId },
      include: { user: true, assignee: true },
    });
  }

  async assign(id: string, assigneeId: string, userId: string, userRole: string) {
    if (userRole !== 'ADMIN' && userRole !== 'STAFF') {
      throw new ForbiddenException('Not authorized to assign grievances');
    }

    return this.prisma.grievance.update({
      where: { id },
      data: { assignedTo: assigneeId, status: GrievanceStatus.IN_PROGRESS },
      include: { user: true, assignee: true },
    });
  }

  async delete(id: string, userId: string, userRole: string) {
    const grievance = await this.findById(id);
    if (userRole !== 'ADMIN' && grievance.userId !== userId) {
      throw new ForbiddenException('Not authorized to delete this grievance');
    }
    return this.prisma.grievance.delete({ where: { id } });
  }

  async getMyGrievances(userId: string, pagination: PaginationDto) {
    return this.findAll(pagination, { userId });
  }

  async getCategories() {
    return Object.values(GrievanceCategory);
  }

  async getStatuses() {
    return Object.values(GrievanceStatus);
  }
}