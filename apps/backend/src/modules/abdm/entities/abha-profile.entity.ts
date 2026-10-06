/**
 * AbhaProfile — ABDM M1/M2: the citizen's linked ABHA (Ayushman Bharat Health
 * Account) identity, used as the patient identifier for consent-scoped sharing.
 *
 * Implemented with MikroORM (rather than Drizzle) because ABHA writes touch
 * identity data and must be auditable and transactional. Column names mirror
 * `prisma/schema.prisma`, which owns the migrations.
 */
import { Entity, Index, PrimaryKey, Property, Unique } from '@mikro-orm/core';

import { newId } from '../../../common/drizzle/id';

@Entity({ tableName: 'abha_profiles' })
export class AbhaProfile {
  @PrimaryKey()
  id: string = newId();

  /** ABHA number issued by the ABDM gateway. */
  @Property()
  @Unique()
  @Index({ name: 'abha_profiles_abhaId_idx' })
  abhaId: string;

  /** Local `users.id` this profile is linked to. */
  @Property()
  @Unique()
  @Index({ name: 'abha_profiles_userId_idx' })
  userId: string;

  /** ABDM "health ID" handle, still accepted by the gateway. */
  @Property()
  @Unique()
  @Index({ name: 'abha_profiles_healthId_idx' })
  healthId: string;

  @Property()
  name: string;

  /** M | F | O | U (per ABDM spec). */
  @Property()
  gender: string;

  @Property()
  dateOfBirth: Date;

  @Property({ nullable: true })
  phone?: string;

  @Property({ nullable: true })
  email?: string;

  /** ABDM `Address` object shape, stored as JSONB. */
  @Property({ type: 'jsonb', nullable: true })
  address?: Record<string, unknown>;

  /** Base64 profile photo from the ABDM gateway. */
  @Property({ type: 'text', nullable: true })
  photo?: string;

  @Property({ onCreate: () => new Date() })
  createdAt: Date = new Date();

  @Property({ onUpdate: () => new Date() })
  updatedAt: Date = new Date();
}