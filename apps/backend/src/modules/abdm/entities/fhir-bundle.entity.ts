/**
 * FhirBundle — ABDM M2 (HIP). One clinical record expressed as a FHIR R4
 * `Bundle`, plus its encrypted transport envelope.
 *
 * `fhirJson` is stored in a native PostgreSQL `JSONB` column rather than a
 * separate NoSQL store: that keeps the whole platform on one engine (simpler
 * MeghRaj/maintenance story) while giving GIN-indexable containment queries,
 * and it lets the bundle commit atomically with its consent and audit rows in a
 * single MikroORM Unit of Work.
 *
 * Per the ABDM spec the payload may only leave the hospital after Fidelius
 * encryption (ECDH P-256 key agreement + AES-256-GCM); `encryptedData` and
 * `encryptionKey` hold that envelope.
 */
import { Entity, Index, PrimaryKey, Property, Unique } from '@mikro-orm/core';

import { newId } from '../../../common/drizzle/id';

export type FhirBundleStatus = 'PENDING' | 'ENCRYPTED' | 'PUSHED' | 'DELIVERED' | 'FAILED';

@Entity({ tableName: 'fhir_bundles' })
export class FhirBundle {
  @PrimaryKey()
  id: string = newId();

  /** FHIR `Bundle.id`; also our idempotency key when retrying gateway pushes. */
  @Property()
  @Unique()
  @Index({ name: 'fhir_bundles_bundleId_idx' })
  bundleId: string;

  @Property({ default: 'Bundle' })
  resourceType: string = 'Bundle';

  /** `document` | `collection` | `searchset` | `message` | `transaction` … */
  @Property()
  bundleType: string;

  @Property()
  @Index({ name: 'fhir_bundles_patientId_idx' })
  patientId: string;

  @Property({ nullable: true })
  @Index({ name: 'fhir_bundles_careContextId_idx' })
  careContextId?: string;

  /** The FHIR R4 resource graph itself. */
  @Property({ type: 'jsonb' })
  fhirJson: Record<string, unknown>;

  /** Fidelius ciphertext (base64), ready for gateway transmission. */
  @Property({ type: 'text', nullable: true })
  encryptedData?: string;

  /** Encrypted symmetric key material — never a plaintext key. */
  @Property({ nullable: true })
  encryptionKey?: string;

  @Property({ default: 'PENDING' })
  @Index({ name: 'fhir_bundles_status_idx' })
  status: FhirBundleStatus = 'PENDING';

  @Property({ onCreate: () => new Date() })
  createdAt: Date = new Date();

  @Property({ onUpdate: () => new Date() })
  updatedAt: Date = new Date();
}