// CareContext Entity - ABDM care context for health information exchange
import { Entity, Property, PrimaryKey, Unique, Index, ManyToOne } from '@mikro-orm/core';
import { v4 as uuidv4 } from 'uuid';
import { AbhaProfile } from './abha-profile.entity';

@Entity({ tableName: 'care_contexts' })
export class CareContext {
  @PrimaryKey({ type: 'uuid' })
  id: string = uuidv4();

  @ManyToOne(() => AbhaProfile, { fieldName: 'abhaProfileId' })
  abhaProfile: AbhaProfile;

  @Property({ type: 'uuid' })
  abhaProfileId: string;

  @Unique()
  @Property({ length: 50 })
  referenceNumber: string;

  @Property({ length: 255 })
  displayName: string;

  @Property({ length: 255 })
  facilityName: string;

  @Property({ length: 100 })
  facilityId: string;

  @Property({ length: 50 })
  careContextType: string;

  @Property({ type: 'date' })
  startDate: Date;

  @Property({ type: 'date', nullable: true })
  endDate?: Date;

  @Property({ length: 20, default: 'ACTIVE' })
  status: string = 'ACTIVE';

  @Property({ onCreate: () => new Date() })
  createdAt: Date = new Date();

  @Property({ onUpdate: () => new Date() })
  updatedAt: Date = new Date();

  @Index()
  @Property()
  referenceNumberIdx: string;

  @Index()
  @Property()
  facilityIdIdx: string;

  @Index()
  @Property()
  abhaProfileIdIdx: string;
}