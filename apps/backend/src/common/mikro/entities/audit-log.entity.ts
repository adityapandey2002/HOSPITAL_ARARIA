/**
 * AuditLog — immutable CERT-In audit trail.
 *
 * CERT-In (Directions of 28 April 2022) requires that user-level actions are
 * logged with timestamps and retained for 180 days within Indian jurisdiction.
 * Rows here are append-only: no service updates or deletes them, and
 * `AuditLogService.purgeOlderThan()` performs the single scheduled retention cut.
 *
 * The physical column names mirror `prisma/schema.prisma` (camelCase columns,
 * snake_case table) because Prisma owns the DDL migrations.
 */
import { Entity, Index, PrimaryKey, Property } from '@mikro-orm/core';

import { newId } from '../../drizzle/id';

@Entity({ tableName: 'audit_logs' })
export class AuditLog {
  @PrimaryKey()
  id: string = newId();

  /** e.g. `FHIR_BUNDLE_CREATE`, `LOGIN_FAILED`, `APPOINTMENT_CANCEL`. */
  @Property()
  @Index({ name: 'audit_logs_action_idx' })
  action: string;

  /** e.g. `FhirBundle`, `ConsentArtefact`, `User`. */
  @Property()
  @Index({ name: 'audit_logs_resource_idx' })
  resource: string;

  @Property({ nullable: true })
  @Index({ name: 'audit_logs_resourceId_idx' })
  resourceId?: string;

  /** Structured, non-PII payload describing what changed. */
  @Property({ type: 'jsonb', nullable: true })
  details?: Record<string, unknown>;

  /** Acting user, when the action was authenticated. */
  @Property({ nullable: true })
  @Index({ name: 'audit_logs_userId_idx' })
  userId?: string;

  @Property({ nullable: true })
  ipAddress?: string;

  @Property({ nullable: true })
  userAgent?: string;

  /** Ties every audit row produced by one request together. */
  @Property({ nullable: true })
  @Index({ name: 'audit_logs_correlationId_idx' })
  correlationId?: string;

  @Property({ onCreate: () => new Date() })
  @Index({ name: 'audit_logs_createdAt_idx' })
  createdAt: Date = new Date();
}