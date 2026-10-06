// ConsentArtefact Entity - ABDM M3 (HIU) consent management
import { Entity, Property, PrimaryKey, Unique, Index } from '@mikro-orm/core';
import { v4 as uuidv4 } from 'uuid';

@Entity({ tableName: 'consent_artefacts' })
export class ConsentArtefact {
  @PrimaryKey({ type: 'uuid' })
  id: string = uuidv4();

  @Unique()
  @Property({ length: 100 })
  consentId: string;

  @Property({ length: 36 })
  patientId: string;

  @Property({ length: 36 })
  hipId: string;

  @Property({ length: 36 })
  hiuId: string;

  @Property({ length: 500 })
  purpose: string;

  @Property({ type: 'text[]' })
  hiTypes: string[];

  @Property({ type: 'date' })
  dateRangeStart: Date;

  @Property({ type: 'date' })
  dateRangeEnd: Date;

  @Property({ type: 'date' })
  dataEraseAt: Date;

  @Property({ length: 20, default: 'PENDING' })
  status: string = 'PENDING'; // PENDING, GRANTED, DENIED, EXPIRED, REVOKED

  @Property({ type: 'jsonb' })
  consentJson: Record<string, any>;

  @Property({ onCreate: () => new Date() })
  createdAt: Date = new Date();

  @Property({ onUpdate: () => new Date() })
  updatedAt: Date = new Date();

  @Index()
  @Property()
  consentIdIdx: string;

  @Index()
  @Property()
  patientIdIdx: string;

  @Index()
  @Property()
  hipIdIdx: string;

  @Index()
  @Property()
  hiuIdIdx: string;

  @Index()
  @Property()
  statusIdx: string;
}