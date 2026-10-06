// Base MikroORM Entity with common fields and audit hooks
import { Entity, Property, PrimaryKey, OnInit, BeforeCreate, BeforeUpdate, BeforeDelete, EventArgs, Index } from '@mikro-orm/core';
import { v4 as uuidv4 } from 'uuid';

export abstract class BaseEntity {
  @PrimaryKey({ type: 'uuid' })
  id: string = uuidv4();

  @Property({ onCreate: () => new Date() })
  createdAt: Date = new Date();

  @Property({ onUpdate: () => new Date() })
  updatedAt: Date = new Date();

  @OnInit()
  onInit(args: any) {
    // Override in concrete entities for audit logging
  }

  @BeforeCreate()
  beforeCreate(args: any) {
    // Override in concrete entities for audit logging
  }

  @BeforeUpdate()
  beforeUpdate(args: any) {
    // Override in concrete entities for audit logging
  }

  @BeforeDelete()
  beforeDelete(args: any) {
    // Override in concrete entities for audit logging
  }
}