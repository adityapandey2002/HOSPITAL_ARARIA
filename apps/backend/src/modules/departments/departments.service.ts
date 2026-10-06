import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { PaginationDto } from '../../common/dto/pagination.dto';

@Injectable()
export class DepartmentsService {
  constructor(private prisma: PrismaService) {}

  async findAll(pagination: PaginationDto) {
    const { page = 1, limit = 50, sortBy = 'name', sortOrder = 'asc' } = pagination;
    const skip = (page - 1) * limit;

    const [departments, total] = await Promise.all([
      this.prisma.department.findMany({
        where: { isActive: true },
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          _count: { select: { doctors: true } },
          doctors: { where: { isActive: true }, select: { id: true, name: true, specialization: true } },
        },
      }),
      this.prisma.department.count({ where: { isActive: true } }),
    ]);

    return { data: departments, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async findById(id: string) {
    const department = await this.prisma.department.findUnique({
      where: { id },
      include: {
        doctors: { where: { isActive: true }, include: { timeSlots: { where: { isAvailable: true } } } },
      },
    });
    if (!department) throw new NotFoundException('Department not found');
    return department;
  }

  async create(data: any) {
    const existing = await this.prisma.department.findUnique({ where: { name: data.name } });
    if (existing) throw new ConflictException('Department already exists');
    return this.prisma.department.create({ data });
  }

  async update(id: string, data: any) {
    await this.findById(id);
    return this.prisma.department.update({ where: { id }, data });
  }

  async delete(id: string) {
    await this.findById(id);
    return this.prisma.department.delete({ where: { id } });
  }
}