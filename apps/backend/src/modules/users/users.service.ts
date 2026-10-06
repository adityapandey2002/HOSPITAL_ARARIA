import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { PaginationDto } from '../../common/dto/pagination.dto';
import * as bcrypt from 'bcrypt';
import { UserRole } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAll(pagination: PaginationDto) {
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = pagination;
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        select: {
          id: true,
          email: true,
          name: true,
          phone: true,
          role: true,
          isActive: true,
          abhaId: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      this.prisma.user.count(),
    ]);

    return {
      data: users,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        isActive: true,
        abhaId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        isActive: true,
        abhaId: true,
        password: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async update(id: string, data: { name?: string; phone?: string; role?: UserRole; isActive?: boolean }) {
    // Check if user exists
    await this.findById(id);

    // If phone is being updated, check for conflicts
    if (data.phone) {
      const existingPhone = await this.prisma.user.findFirst({
        where: { phone: data.phone, NOT: { id } },
      });
      if (existingPhone) {
        throw new ConflictException('Phone number already in use');
      }
    }

    return this.prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        isActive: true,
        abhaId: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async updatePassword(id: string, newPassword: string) {
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    return this.prisma.user.update({
      where: { id },
      data: { password: hashedPassword },
    });
  }

  async delete(id: string) {
    await this.findById(id);
    return this.prisma.user.delete({ where: { id } });
  }

  async getProfile(userId: string) {
    return this.findById(userId);
  }

  async updateProfile(userId: string, data: { name?: string; phone?: string }) {
    return this.update(userId, data);
  }
}