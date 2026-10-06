/**
 * ConsentArtefact — ABDM M3 (HIU). A citizen's machine-readable consent to
 * share specific health-information types from specific HIUs, over a date range,
 * for a stated purpose.
 *
 * Consent is the legal basis for every read: `AbdmService.getRecords()` refuses
 * to fetch unless a GRANTED, non-expired artefact covers the requested HI types.
 */
import { Entity, Index, PrimaryKey, Property, Unique } from '@mikro-orm/core';

import { newId } from '../../../common/drizzle/id';

export type ConsentStatus = 'PENDING' | 'GRANTED' | 'DENIED' | 'EXPIRED' | 'REVOKED';

@Entity({ tableName: 'consent_artefacts' })
export class ConsentArtefact {
  @PrimaryKey()
  id: string = newId();

  @Property()
  @Unique()
  @Index({ name: 'consent_artefacts_consentId_idx' })
  consentId: string;

  @Property()
  @Index({ name: 'consent_artefacts_patientId_idx' })
  patientId: string;

  /** HIP this consent is addressed to (one per facility). */
  @Property()
  @Index({ name: 'consent_artefacts_hipId_idx' })
  hipId: string;

  /** HIU the citizen authorised to read. */
  @Property()
  @Index({ name: 'consent_artefacts_hiuId_idx' })
  hiuId: string;

  /** e.g. `TREATMENT`, `DIAGNOSIS`, `EMERGENCY`. */
  @Property()
  purpose: string;

  /** ABDM `HI.type` codes, e.g. `ALL`, `LAB_REPORTS`, `PRESCRIPTIONS`. */
  @Property({ type: 'text[]' })
  hiTypes: string[] = [];

  @Property()
  dateRangeStart: Date;

  @Property()
  dateRangeEnd: Date;

  /** ABDM mandates erasure no later than 90 days after `dateRangeEnd`. */
  @Property()
  dataEraseAt: Date;

  @Property({ default: 'PENDING' })
  @Index({ name: 'consent_artefacts_status_idx' })
  status: ConsentStatus = 'PENDING';

  /** The signed artefact exactly as the gateway returned it (audit evidence). */
  @Property({ type: 'jsonb' })
  consentJson: Record<string, unknown>;

  @Property({ onCreate: () => new Date() })
  createdAt: Date = new Date();

  @Property({ onUpdate: () => new Date() })
  updatedAt: Date = new Date();
}