// FhirBundle Entity - ABDM M2 (HIP) FHIR bundle generation with Fidelius encryption
import { Entity, Property, PrimaryKey, Unique, Index } from '@mikro-orm/core';
import { v4 as uuidv4 } from 'uuid';

@Entity({ tableName: 'fhir_bundles' })
export class FhirBundle {
  @PrimaryKey({ type: 'uuid' })
  id: string = uuidv4();

  @Unique()
  @Property({ length: 100 })
  bundleId: string;

  @Property({ default: 'Bundle' })
  resourceType: string = 'Bundle';

  @Property({ length: 50 })
  bundleType: string; // 'document', 'message', 'transaction', 'batch', 'history', 'searchset', 'collection'

  @Property()
  patientId: string;

  @Property({ nullable: true })
  careContextId?: string;

  @Property({ type: 'jsonb' })
  fhirJson: Record<string, any>;

  @Property({ nullable: true, type: 'text' })
  encryptedData?: string;

  @Property({ nullable: true, length: 500 })
  encryptionKey?: string;

  @Property({ length: 20, default: 'PENDING' })
  status: string = 'PENDING'; // PENDING, ENCRYPTED, SENT, DELIVERED, FAILED

  @Property({ onCreate: () => new Date() })
  createdAt: Date = new Date();

  @Property({ onUpdate: () => new Date() })
  updatedAt: Date = new Date();

  @Index()
  @Property()
  bundleIdIdx: string;

  @Index()
  @Property()
  patientIdIdx: string;

  @Index()
  @Property()
  careContextIdIdx: string;

  @Index()
  @Property()
  statusIdx: string;
}