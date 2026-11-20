import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, asc, count, desc, eq, gt } from 'drizzle-orm';
import type { AnyPgColumn } from 'drizzle-orm/pg-core';
import { randomUUID } from 'node:crypto';
import { BloodGroup, BloodComponentType, BloodRequestStatus } from '@dh-araria/shared';

import { PaginationDto } from '../../common/dto/pagination.dto';
import { DRIZZLE, type DrizzleDb } from '../../common/drizzle/drizzle.module';
import { newId } from '../../common/drizzle/id';
import {
  bloodStock,
  bloodRequests,
  type BloodRequestRow,
  type NewBloodRequestRow,
  type BloodStockRow,
} from '../../common/drizzle/schema';

import { SubmitBloodRequestDto, UpdateBloodRequestStatusDto } from './dto/blood-request.dto';

export const BLOOD_GROUPS = [
  'A_POSITIVE',
  'A_NEGATIVE',
  'B_POSITIVE',
  'B_NEGATIVE',
  'AB_POSITIVE',
  'AB_NEGATIVE',
  'O_POSITIVE',
  'O_NEGATIVE',
] as const;

export const BLOOD_COMPONENT_TYPES = [
  'WHOLE_BLOOD',
  'PACKED_RED_CELLS',
  'PLATELETS',
  'PLASMA',
  'CRYOPRECIPITATE',
] as const;

export type BloodGroupValue = (typeof BLOOD_GROUPS)[number];
export type BloodComponentTypeValue = (typeof BLOOD_COMPONENT_TYPES)[number];

const SORTABLE: Record<string, AnyPgColumn> = {
  bloodGroup: bloodStock.bloodGroup,
  componentType: bloodStock.componentType,
  unitsAvailable: bloodStock.unitsAvailable,
  lastUpdated: bloodStock.lastUpdated,
};

@Injectable()
export class BloodBankService {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDb) {}

  async findAll(pagination: PaginationDto) {
    const page = pagination.page ?? 1;
    const limit = pagination.limit ?? 50;
    const column = SORTABLE[pagination.sortBy ?? 'bloodGroup'] ?? bloodStock.bloodGroup;
    const orderBy = pagination.sortOrder === 'asc' ? asc(column) : desc(column);

    const [rows, totals] = await Promise.all([
      this.db
        .select()
        .from(bloodStock)
        .orderBy(orderBy)
        .limit(limit)
        .offset((page - 1) * limit),
      this.db.select({ value: count() }).from(bloodStock),
    ]);

    const total = totals[0]?.value ?? 0;
    return { data: rows, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  /**
   * Grouped availability, e.g. `{ O_NEGATIVE: { WHOLE_BLOOD: 3 } }`.
   * Drives the e-RaktKosh sync badge on the homepage.
   */
  async getStockSummary(): Promise<Record<string, Record<string, number>>> {
    const rows = await this.db
      .select()
      .from(bloodStock)
      .where(gt(bloodStock.unitsAvailable, 0))
      .orderBy(asc(bloodStock.bloodGroup), asc(bloodStock.componentType));

    return rows.reduce<Record<string, Record<string, number>>>((summary, row) => {
      summary[row.bloodGroup] ??= {};
      summary[row.bloodGroup][row.componentType] = row.unitsAvailable;
      return summary;
    }, {});
  }

  /** Relative adjustment (donation `+`, issue `-`). Never lets stock go negative. */
  async updateStock(
    bloodGroup: BloodGroupValue,
    componentType: BloodComponentTypeValue,
    units: number
  ): Promise<BloodStockRow> {
    const key = and(
      eq(bloodStock.bloodGroup, bloodGroup),
      eq(bloodStock.componentType, componentType)
    );

    const [existing] = await this.db.select().from(bloodStock).where(key).limit(1);

    if (existing) {
      const next = existing.unitsAvailable + units;
      if (next < 0) {
        throw new BadRequestException(
          `Insufficient stock: only ${existing.unitsAvailable} unit(s) of ${bloodGroup} ${componentType} available`
        );
      }

      const [updated] = await this.db
        .update(bloodStock)
        .set({ unitsAvailable: next, lastUpdated: new Date() })
        .where(key)
        .returning();

      return updated;
    }

    if (units < 0) throw new BadRequestException('Cannot reduce stock that does not exist');

    const [created] = await this.db
      .insert(bloodStock)
      .values({ id: newId(), bloodGroup, componentType, unitsAvailable: units })
      .returning();

    return created;
  }

  /** Absolute set used by inventory audits and e-RaktKosh corrections. */
  async setStock(
    bloodGroup: BloodGroupValue,
    componentType: BloodComponentTypeValue,
    units: number
  ): Promise<BloodStockRow> {
    if (units < 0) throw new BadRequestException('Units cannot be negative');

    const [row] = await this.db
      .insert(bloodStock)
      .values({ id: newId(), bloodGroup, componentType, unitsAvailable: units })
      .onConflictDoUpdate({
        target: [bloodStock.bloodGroup, bloodStock.componentType],
        set: { unitsAvailable: units, lastUpdated: new Date() },
      })
      .returning();

    return row;
  }

  async getBloodGroups(): Promise<readonly string[]> {
    return BLOOD_GROUPS;
  }

  async getComponentTypes(): Promise<readonly string[]> {
    return BLOOD_COMPONENT_TYPES;
  }

  async findOne(bloodGroup: string, componentType: string): Promise<BloodStockRow> {
    const [row] = await this.db
      .select()
      .from(bloodStock)
      .where(
        and(
          eq(bloodStock.bloodGroup, bloodGroup as BloodGroupValue),
          eq(bloodStock.componentType, componentType as BloodComponentTypeValue)
        )
      )
      .limit(1);

    if (!row) throw new NotFoundException('Blood stock record not found');
    return row;
  }

  async createRequest(dto: SubmitBloodRequestDto, createdBy?: string): Promise<BloodRequestRow> {
    const [created] = await this.db
      .insert(bloodRequests)
      .values({
        id: newId(),
        reference: this.mintReference(),
        patientName: dto.patientName,
        requesterName: dto.requesterName,
        phone: dto.phone,
        email: dto.email,
        bloodGroup: dto.bloodGroup,
        componentType: dto.componentType,
        units: dto.units,
        neededBy: new Date(dto.neededBy),
        hospital: dto.hospital,
        reason: dto.reason,
        createdBy,
      } satisfies NewBloodRequestRow)
      .returning();
    return created;
  }

  async listRequests(pagination: PaginationDto, filters: { status?: BloodRequestStatus } = {}) {
    const page = pagination.page ?? 1;
    const limit = pagination.limit ?? 25;
    const column =
      (pagination.sortBy
        ? {
            status: bloodRequests.status,
            units: bloodRequests.units,
            neededBy: bloodRequests.neededBy,
            createdAt: bloodRequests.createdAt,
            reference: bloodRequests.reference,
          }[pagination.sortBy]
        : undefined) ?? bloodRequests.createdAt;
    const orderBy = pagination.sortOrder === 'asc' ? asc(column) : desc(column);
    const where = filters.status ? eq(bloodRequests.status, filters.status) : undefined;

    const [rows, totals] = await Promise.all([
      this.db
        .select()
        .from(bloodRequests)
        .where(where)
        .orderBy(orderBy)
        .limit(limit)
        .offset((page - 1) * limit),
      this.db.select({ value: count() }).from(bloodRequests).where(where),
    ]);
    const total = totals[0]?.value ?? 0;
    return { data: rows, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async updateRequestStatus(
    id: string,
    status: BloodRequestStatus,
    notes?: string
  ): Promise<BloodRequestRow> {
    await this.findRequest(id);
    const [updated] = await this.db
      .update(bloodRequests)
      .set({ status, notes, updatedAt: new Date() })
      .where(eq(bloodRequests.id, id))
      .returning();
    return updated;
  }

  private async findRequest(id: string): Promise<BloodRequestRow> {
    const [row] = await this.db
      .select()
      .from(bloodRequests)
      .where(eq(bloodRequests.id, id))
      .limit(1);
    if (!row) throw new NotFoundException('Blood request not found');
    return row;
  }

  /** Unique human-readable ticket number, `BLR-` + 8 random hex characters. */
  private mintReference(): string {
    return `BLR-${randomUUID().toUpperCase().slice(0, 8)}`;
  }
}
