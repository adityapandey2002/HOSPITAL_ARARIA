// AbhaProfile Entity - ABDM M1/M2 integration
import { Entity, Property, PrimaryKey, Unique, Index, BeforeCreate, BeforeUpdate, BeforeDelete } from '@mikro-orm/core';
import { v4 as uuidv4 } from 'uuid';

@Entity({ tableName: 'abha_profiles' })
export class AbhaProfile {
  @PrimaryKey({ type: 'uuid' })
  id: string = uuidv4();

  @Unique()
  @Property({ length: 36 })
  abhaId: string;

  @Unique()
  @Property()
  userId: string;

  @Unique()
  @Property({ length: 20 })
  healthId: string;

  @Property({ length: 255 })
  name: string;

  @Property({ length: 20 })
  gender: string;

  @Property({ type: 'date' })
  dateOfBirth: Date;

  @Property({ length: 20, nullable: true })
  phone?: string;

  @Property({ length: 255, nullable: true })
  email?: string;

  @Property({ type: 'jsonb', nullable: true })
  address?: Record<string, any>;

  @Property({ nullable: true })
  photo?: string;

  @Property({ onCreate: () => new Date() })
  createdAt: Date = new Date();

  @Property({ onUpdate: () => new Date() })
  updatedAt: Date = new Date();

  @Index()
  @Property()
  abhaIdIdx: string;

  @Index()
  @Property()
  healthIdIdx: string;

  @Index()
  @Property()
  userIdIdx: string;
}