import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { bloodStock, bloodGroupEnum, bloodComponentTypeEnum } from '../../common/drizzle/schema';
import { eq, and, desc, asc, sql, count, gt } from 'drizzle-orm';
import { BloodGroup, BloodComponentType } from '@dh-araria/shared/types';

@Injectable()
export class BloodBankService {
  constructor(
    @Inject('DRIZZLE') private db: any,
  ) {}

  async findAll(pagination: any) {
    const { page = 1, limit = 50, sortBy = 'bloodGroup', sortOrder = 'asc' } = pagination;
    const offset = (page - 1) * limit;

    const sortColumn = bloodStock[sortBy as keyof typeof bloodStock];
    const orderBy = sortOrder === 'asc' ? asc(sortColumn as any) : desc(sortColumn as any);

    const [stock, totalResult] = await Promise.all([
      this.db
        .select()
        .from(bloodStock)
        .orderBy(orderBy)
        .limit(limit)
        .offset(offset),
      this.db.select({ count: count() }).from(bloodStock),
    ]);

    const total = totalResult[0]?.count || 0;

    return { data: stock, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async getStockSummary() {
    const stock = await this.db
      .select()
      .from(bloodStock)
      .where(gt(bloodStock.unitsAvailable, 0))
      .orderBy(asc(bloodStock.bloodGroup), asc(bloodStock.componentType));

    const summary = stock.reduce((acc: any, item: any) => {
      if (!acc[item.bloodGroup]) acc[item.bloodGroup] = {};
      acc[item.bloodGroup][item.componentType] = item.unitsAvailable;
      return acc;
    }, {} as Record<string, Record<string, number>>);

    return summary;
  }

  async updateStock(bloodGroup: BloodGroup, componentType: BloodComponentType, units: number) {
    const existing = await this.db
      .select()
      .from(bloodStock)
      .where(and(eq(bloodStock.bloodGroup, bloodGroup), eq(bloodStock.componentType, componentType)))
      .limit(1);

    if (existing[0]) {
      const newUnits = existing[0].unitsAvailable + units;
      if (newUnits < 0) throw new BadRequestException('Insufficient stock');
      const result = await this.db
        .update(bloodStock)
        .set({ unitsAvailable: newUnits, lastUpdated: new Date() })
        .where(and(eq(bloodStock.bloodGroup, bloodGroup), eq(bloodStock.componentType, componentType)))
        .returning();
      return result[0];
    }

    if (units < 0) throw new BadRequestException('Cannot reduce non-existent stock');
    const result = await this.db
      .insert(bloodStock)
      .values({ bloodGroup, componentType, unitsAvailable: units })
      .returning();
    return result[0];
  }

  async setStock(bloodGroup: BloodGroup, componentType: BloodComponentType, units: number) {
    if (units < 0) throw new BadRequestException('Units cannot be negative');
    const result = await this.db
      .insert(bloodStock)
      .values({ bloodGroup, componentType, unitsAvailable: units })
      .onConflictDoUpdate({
        target: [bloodStock.bloodGroup, bloodStock.componentType],
        set: { unitsAvailable: units, lastUpdated: new Date() },
      })
      .returning();
    return result[0];
  }

  async getBloodGroups() {
    return Object.values({ A_POSITIVE: 'A+', A_NEGATIVE: 'A-', B_POSITIVE: 'B+', B_NEGATIVE: 'B-', AB_POSITIVE: 'AB+', AB_NEGATIVE: 'AB-', O_POSITIVE: 'O+', O_NEGATIVE: 'O-' });
  }

  async getComponentTypes() {
    return Object.values({ WHOLE_BLOOD: 'WHOLE_BLOOD', PACKED_RED_CELLS: 'PACKED_RED_CELLS', PLATELETS: 'PLATELETS', PLASMA: 'PLASMA', CRYOPRECIPITATE: 'CRYOPRECIPITATE' });
  }
}