import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { NoticeCategory, NoticePriority } from '@dh-araria/shared/types';

@Injectable()
export class NoticesService {
  constructor(private prisma: PrismaService) {}

  async findAll(pagination: PaginationDto, filters?: any) {
    const { page = 1, limit = 10, sortBy = 'publishedAt', sortOrder = 'desc' } = pagination;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (filters?.category) where.category = filters.category;
    if (filters?.priority) where.priority = filters.priority;
    if (filters?.isPublished !== undefined) where.isPublished = filters.isPublished;
    if (filters?.language) where.language = filters.language;
    if (filters?.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { content: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const [notices, total] = await Promise.all([
      this.prisma.notice.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
      this.prisma.notice.count({ where }),
    ]);

    return { data: notices, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async findPublished(pagination: PaginationDto, language?: string) {
    const { page = 1, limit = 10, sortBy = 'publishedAt', sortOrder = 'desc' } = pagination;
    const skip = (page - 1) * limit;

    const where: any = {
      isPublished: true,
      OR: [
        { expiresAt: null },
        { expiresAt: { gte: new Date() } },
      ],
    };
    if (language) where.language = language;

    const [notices, total] = await Promise.all([
      this.prisma.notice.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
      this.prisma.notice.count({ where }),
    ]);

    return { data: notices, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async findById(id: string) {
    const notice = await this.prisma.notice.findUnique({ where: { id } });
    if (!notice) throw new NotFoundException('Notice not found');
    return notice;
  }

  async create(data: any, userId: string) {
    return this.prisma.notice.create({
      data: {
        ...data,
        publishedAt: data.isPublished ? new Date() : null,
      },
    });
  }

  async update(id: string, data: any, userId: string, userRole: string) {
    const notice = await this.findById(id);
    
    if (userRole !== 'ADMIN' && userRole !== 'STAFF') {
      throw new ForbiddenException('Not authorized to update notices');
    }

    const updateData: any = { ...data };
    if (data.isPublished && !notice.isPublished) {
      updateData.publishedAt = new Date();
    } else if (data.isPublished === false) {
      updateData.publishedAt = null;
    }

    return this.prisma.notice.update({ where: { id }, data: updateData });
  }

  async delete(id: string, userId: string, userRole: string) {
    if (userRole !== 'ADMIN' && userRole !== 'STAFF') {
      throw new ForbiddenException('Not authorized to delete notices');
    }
    await this.findById(id);
    return this.prisma.notice.delete({ where: { id } });
  }

  async getCategories() {
    return Object.values(NoticeCategory);
  }

  async getPriorities() {
    return Object.values(NoticePriority);
  }
}