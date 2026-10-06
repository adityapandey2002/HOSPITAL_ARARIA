// AuditLog Entity - CERT-In compliant audit trail
import { Entity, Property, PrimaryKey, Index } from '@mikro-orm/core';
import { v4 as uuidv4 } from 'uuid';

@Entity({ tableName: 'audit_logs' })
export class AuditLog {
  @PrimaryKey({ type: 'uuid' })
  id: string = uuidv4();

  @Property({ length: 100 })
  action: string; // e.g., 'FHIR_BUNDLE_CREATE', 'LOGIN_FAILED', 'APPOINTMENT_CREATE'

  @Property({ length: 100 })
  resource: string; // e.g., 'FhirBundle', 'Appointment', 'User'

  @Property({ length: 100 })
  resourceId: string;

  @Property({ type: 'jsonb' })
  details: Record<string, any> = {};

  @Property({ length: 36, nullable: true })
  userId?: string;

  @Property({ length: 45, nullable: true })
  ipAddress?: string;

  @Property({ length: 500, nullable: true })
  userAgent?: string;

  @Property({ length: 36, nullable: true })
  correlationId?: string;

  @Property({ onCreate: () => new Date() })
  createdAt: Date = new Date();
}