import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { BloodGroup, BloodComponentType } from '@prisma/client';

@Injectable()
export class BloodBankService {
  constructor(private prisma: PrismaService) {}

  async findAll(pagination: PaginationDto) {
    const { page = 1, limit = 50, sortBy = 'bloodGroup', sortOrder = 'asc' } = pagination;
    const skip = (page - 1) * limit;

    const where: any = {};
    
    const [stock, total] = await Promise.all([
      this.prisma.bloodStock.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
      this.prisma.bloodStock.count({ where }),
    ]);

    return { data: stock, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async getStockSummary() {
    const stock = await this.prisma.bloodStock.findMany({
      where: { unitsAvailable: { gt: 0 } },
      orderBy: [{ bloodGroup: 'asc' }, { componentType: 'asc' }],
    });

    const summary = stock.reduce((acc, item) => {
      if (!acc[item.bloodGroup]) acc[item.bloodGroup] = {};
      acc[item.bloodGroup][item.componentType] = item.unitsAvailable;
      return acc;
    }, {} as Record<string, Record<string, number>>);

    return summary;
  }

  async updateStock(bloodGroup: BloodGroup, componentType: BloodComponentType, units: number) {
    const existing = await this.prisma.bloodStock.findUnique({
      where: { bloodGroup_componentType: { bloodGroup, componentType } },
    });

    if (existing) {
      const newUnits = existing.unitsAvailable + units;
      if (newUnits < 0) throw new BadRequestException('Insufficient stock');
      return this.prisma.bloodStock.update({
        where: { id: existing.id },
        data: { unitsAvailable: newUnits, lastUpdated: new Date() },
      });
    }

    if (units < 0) throw new BadRequestException('Cannot reduce non-existent stock');
    return this.prisma.bloodStock.create({
      data: { bloodGroup, componentType, unitsAvailable: units },
    });
  }

  async setStock(bloodGroup: BloodGroup, componentType: BloodComponentType, units: number) {
    if (units < 0) throw new BadRequestException('Units cannot be negative');
    return this.prisma.bloodStock.upsert({
      where: { bloodGroup_componentType: { bloodGroup, componentType } },
      update: { unitsAvailable: units, lastUpdated: new Date() },
      create: { bloodGroup, componentType, unitsAvailable: units },
    });
  }

  async getBloodGroups() {
    return Object.values(BloodGroup);
  }

  async getComponentTypes() {
    return Object.values(BloodComponentType);
  }
}