/**
 * CareContext — ABDM concept describing "an episode of care" for one patient at
 * one facility (an OPD visit, an admission, a lab collection).
 *
 * A Health Information Provider (HIP) may only push records against an ACTIVE
 * care context, and a Health Information User (HIU) may only read records
 * belonging to care contexts covered by a consent artefact — so this entity is
 * central to every ABDM privacy check.
 */
import { Cascade, Entity, Index, ManyToOne, PrimaryKey, Property, Unique } from '@mikro-orm/core';

import { newId } from '../../../common/drizzle/id';
import { AbhaProfile } from './abha-profile.entity';

@Entity({ tableName: 'care_contexts' })
export class CareContext {
  @PrimaryKey()
  id: string = newId();

  @ManyToOne(() => AbhaProfile, { cascade: [Cascade.PERSIST], fieldName: 'abhaProfileId' })
  abhaProfile: AbhaProfile;

  @Property()
  @Index({ name: 'care_contexts_abhaProfileId_idx' })
  abhaProfileId: string;

  /** Human-facing reference printed on the OPD slip, e.g. `CC/2026/000123`. */
  @Property()
  @Unique()
  @Index({ name: 'care_contexts_referenceNumber_idx' })
  referenceNumber: string;

  /** Display name shown in the ABDM PHR (Personal Health Record) app. */
  @Property()
  displayName: string;

  @Property()
  facilityName: string;

  /** ABDM HIP identifier issued to this hospital. */
  @Property()
  @Index({ name: 'care_contexts_facilityId_idx' })
  facilityId: string;

  /** `OPDC`, `IPD`, `EMERGENCY`, `LAB`, … */
  @Property()
  careContextType: string;

  @Property()
  startDate: Date;

  @Property({ nullable: true })
  endDate?: Date;

  @Property({ default: 'ACTIVE' })
  @Index({ name: 'care_contexts_status_idx' })
  status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED' = 'ACTIVE';

  @Property({ onCreate: () => new Date() })
  createdAt: Date = new Date();

  @Property({ onUpdate: () => new Date() })
  updatedAt: Date = new Date();
}