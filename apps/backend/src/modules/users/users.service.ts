import { ConflictException, ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { and, asc, count, desc, eq, ilike, ne, or } from 'drizzle-orm';
import type { AnyPgColumn } from 'drizzle-orm/pg-core';

import { PaginationDto } from '../../common/dto/pagination.dto';
import { DRIZZLE, type DrizzleDb } from '../../common/drizzle/drizzle.module';
import { newId } from '../../common/drizzle/id';
import { users } from '../../common/drizzle/schema';

import { ListUsersQueryDto } from './dto/user.dto';

type UserRoleValue = NonNullable<(typeof users.$inferInsert)['role']>;

/**
 * Columns safe to return to callers. `password` is deliberately absent so the
 * hash can only leave this service through the two explicit credential lookups
 * (`findByEmail`, `findByIdWithPassword`).
 */
const PUBLIC_COLUMNS = {
  id: users.id,
  email: users.email,
  name: users.name,
  phone: users.phone,
  role: users.role,
  isActive: users.isActive,
  abhaId: users.abhaId,
  createdAt: users.createdAt,
  updatedAt: users.updatedAt,
} as const;

/** Allow-listed sort targets — `sortBy` arrives from the query string. */
const SORTABLE: Record<string, AnyPgColumn> = {
  createdAt: users.createdAt,
  updatedAt: users.updatedAt,
  name: users.name,
  email: users.email,
  role: users.role,
};

export interface CreateUserInput {
  email: string;
  /** Already hashed by the caller — this layer never sees a plaintext password. */
  password: string;
  name: string;
  phone?: string;
  role?: UserRoleValue;
}

export interface UpdateUserInput {
  name?: string;
  phone?: string;
  role?: UserRoleValue;
  isActive?: boolean;
}

/**
 * Owns the `users` table.
 *
 * Auth, the JWT strategy and the doctors module all reach identity rows through
 * this service rather than issuing their own queries. That keeps the password
 * hash inside one module and means a change to the identity schema lands in one
 * place.
 */
@Injectable()
export class UsersService {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDb) {}

  async findAll(pagination: ListUsersQueryDto) {
    const page = pagination.page ?? 1;
    const limit = pagination.limit ?? 10;
    const offset = (page - 1) * limit;
    const column = SORTABLE[pagination.sortBy ?? 'createdAt'] ?? users.createdAt;
    const orderBy = pagination.sortOrder === 'asc' ? asc(column) : desc(column);

    const conditions = [];
    if (pagination.role) conditions.push(eq(users.role, pagination.role));
    if (typeof pagination.isActive === 'boolean') conditions.push(eq(users.isActive, pagination.isActive));
    if (pagination.search) {
      const term = `%${pagination.search.toLowerCase()}%`;
      conditions.push(
        or(ilike(users.name, term), ilike(users.email, term), ilike(users.phone, term))
      );
    }
    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const [rows, totals] = await Promise.all([
      this.db.select(PUBLIC_COLUMNS).from(users).where(where).orderBy(orderBy).limit(limit).offset(offset),
      this.db.select({ value: count() }).from(users).where(where),
    ]);

    const total = totals[0]?.value ?? 0;
    return { data: rows, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async findById(id: string) {
    const user = await this.findByIdOrNull(id);
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  /** Non-throwing variant for callers that map absence to their own error. */
  async findByIdOrNull(id: string) {
    const [user] = await this.db
      .select(PUBLIC_COLUMNS)
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    return user ?? null;
  }

  /**
   * Credential lookup for the login path. This is the only read that selects
   * `password`; callers must not pass the result on to a response.
   */
  async findByEmail(email: string) {
    const [user] = await this.db
      .select({ ...PUBLIC_COLUMNS, password: users.password })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    return user ?? null;
  }

  async findByPhone(phone: string) {
    const [user] = await this.db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.phone, phone))
      .limit(1);

    return user ?? null;
  }

  /** Credential lookup for password-change and reset flows. */
  async findByIdWithPassword(id: string) {
    const [user] = await this.db
      .select({ ...PUBLIC_COLUMNS, password: users.password })
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    return user ?? null;
  }

  async create(data: CreateUserInput) {
    const [created] = await this.db
      .insert(users)
      .values({
        id: newId(),
        email: data.email,
        password: data.password,
        name: data.name,
        phone: data.phone,
        role: data.role ?? 'PATIENT',
      })
      .returning(PUBLIC_COLUMNS);

    return created;
  }

  async update(id: string, data: UpdateUserInput, actorId?: string) {
    const target = await this.findByIdOrNull(id);
    if (!target) throw new NotFoundException('User not found');

    if (actorId && target.id === actorId) {
      if (data.role && data.role !== target.role) {
        throw new ForbiddenException('You cannot change your own role');
      }
      if (typeof data.isActive === 'boolean' && data.isActive !== target.isActive) {
        throw new ForbiddenException('You cannot deactivate or activate yourself');
      }
    }

    if (data.phone) {
      const [clash] = await this.db
        .select({ id: users.id })
        .from(users)
        .where(and(eq(users.phone, data.phone), ne(users.id, id)))
        .limit(1);
      if (clash) throw new ConflictException('Phone number already in use');
    }

    const [updated] = await this.db
      .update(users)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning(PUBLIC_COLUMNS);

    return updated;
  }

  async updatePassword(id: string, newPassword: string) {
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await this.db
      .update(users)
      .set({ password: hashedPassword, updatedAt: new Date() })
      .where(eq(users.id, id));
  }

  async delete(id: string, actorId?: string) {
    const target = await this.findByIdOrNull(id);
    if (!target) throw new NotFoundException('User not found');
    if (actorId && target.id === actorId) {
      throw new ForbiddenException('You cannot delete yourself');
    }
    const [deleted] = await this.db.delete(users).where(eq(users.id, id)).returning(PUBLIC_COLUMNS);
    return deleted;
  }

  async getProfile(userId: string) {
    return this.findById(userId);
  }

  async updateProfile(userId: string, data: { name?: string; phone?: string }) {
    return this.update(userId, data);
  }
}
