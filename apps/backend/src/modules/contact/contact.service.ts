import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { asc, count, desc, eq } from 'drizzle-orm';
import type { AnyPgColumn } from 'drizzle-orm/pg-core';

import { ContactMessageStatus } from '@dh-araria/shared';

import { PaginationDto } from '../../common/dto/pagination.dto';
import { DRIZZLE, type DrizzleDb } from '../../common/drizzle/drizzle.module';
import { newId } from '../../common/drizzle/id';
import {
  contactMessages,
  type ContactMessageRow,
  type NewContactMessageRow,
} from '../../common/drizzle/schema';

import type { ContactQueryDto } from './dto/contact-query.dto';
import type { CreateContactMessageDto } from './dto/create-contact-message.dto';

const SORTABLE: Record<string, AnyPgColumn> = {
  createdAt: contactMessages.createdAt,
  status: contactMessages.status,
  subject: contactMessages.subject,
};

/**
 * Owns the `contact_messages` table.
 *
 * The public `POST /contact` writes here; the admin listing, status transition
 * and deletion routes are the only readers. Nothing here is exposed publicly.
 */
@Injectable()
export class ContactService {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDb) {}

  async create(data: CreateContactMessageDto): Promise<ContactMessageRow> {
    const [created] = await this.db
      .insert(contactMessages)
      .values({
        ...data,
        id: newId(),
        status: ContactMessageStatus.NEW,
        createdAt: new Date(),
        updatedAt: new Date(),
      } satisfies NewContactMessageRow)
      .returning();

    return created;
  }

  async findAll(pagination: ContactQueryDto) {
    const page = pagination.page ?? 1;
    const limit = pagination.limit ?? 10;
    const column = SORTABLE[pagination.sortBy ?? 'createdAt'] ?? contactMessages.createdAt;
    const orderBy = pagination.sortOrder === 'asc' ? asc(column) : desc(column);

    const where = pagination.status ? eq(contactMessages.status, pagination.status) : undefined;

    const [rows, totals] = await Promise.all([
      this.db
        .select()
        .from(contactMessages)
        .where(where)
        .orderBy(orderBy)
        .limit(limit)
        .offset((page - 1) * limit),
      this.db.select({ value: count() }).from(contactMessages).where(where),
    ]);

    const total = totals[0]?.value ?? 0;
    return { data: rows, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async findById(id: string): Promise<ContactMessageRow> {
    const [row] = await this.db
      .select()
      .from(contactMessages)
      .where(eq(contactMessages.id, id))
      .limit(1);

    if (!row) throw new NotFoundException('Contact message not found');
    return row;
  }

  async updateStatus(id: string, status: ContactMessageStatus): Promise<ContactMessageRow> {
    await this.findById(id);

    const [updated] = await this.db
      .update(contactMessages)
      .set({ status, updatedAt: new Date() })
      .where(eq(contactMessages.id, id))
      .returning();

    return updated;
  }

  async delete(id: string): Promise<{ success: true }> {
    await this.findById(id);
    await this.db.delete(contactMessages).where(eq(contactMessages.id, id));
    return { success: true };
  }

  /** Counts per status — drives the admin inbox badges. */
  async getStats(): Promise<Record<string, number>> {
    const rows = await this.db
      .select({ status: contactMessages.status, value: count() })
      .from(contactMessages)
      .groupBy(contactMessages.status);

    const stats: Record<string, number> = {
      NEW: 0,
      IN_PROGRESS: 0,
      RESOLVED: 0,
      CLOSED: 0,
    };
    for (const row of rows) stats[row.status] = row.value;
    return stats;
  }
}
