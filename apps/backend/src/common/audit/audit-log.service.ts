/**
 * AuditLogService
 * ---------------
 * Single write path for the CERT-In audit trail.
 *
 * Compliance notes (CERT-In Directions, 28 April 2022):
 *  - Logs are retained 180 days inside India (see `CertInService` for the purge).
 *  - Every row is timestamped server-side from NTP-synced clocks
 *    (`forceUtcTimezone: true` in the MikroORM config).
 *  - Logging must never take down the business operation, so failures are
 *    swallowed and surfaced as errors instead of exceptions.
 */
import { Inject, Injectable, Logger } from '@nestjs/common';
import { EntityManager, FilterQuery } from '@mikro-orm/core';

import { newId } from '../drizzle/id';
import { AuditLog } from '../mikro/entities/audit-log.entity';
import { ENTITY_MANAGER } from '../mikro/mikro.module';

export interface AuditLogEntry {
  /** e.g. `FHIR_BUNDLE_CREATE`, `LOGIN_FAILED`. */
  action: string;
  /** e.g. `FhirBundle`, `User`. */
  resource: string;
  resourceId: string;
  /** Non-PII structured context. Never place diagnoses or raw FHIR payloads here. */
  details?: Record<string, unknown>;
  userId?: string;
  ipAddress?: string;
  userAgent?: string;
  correlationId?: string;
}

export interface AuditQuery {
  action?: string;
  resource?: string;
  resourceId?: string;
  userId?: string;
  correlationId?: string;
  from?: Date;
  to?: Date;
  limit?: number;
  offset?: number;
}

export const SECURITY_EVENT_ACTIONS = [
  'LOGIN_FAILED',
  'LOGOUT',
  'TOKEN_EXPIRED',
  'TOKEN_INVALID',
  'PERMISSION_DENIED',
  'UNAUTHORIZED_ACCESS',
  'RATE_LIMIT_EXCEEDED',
] as const;

@Injectable()
export class AuditLogService {
  private readonly logger = new Logger(AuditLogService.name);

  constructor(@Inject(ENTITY_MANAGER) private readonly em: EntityManager) {}

  /** Append one audit row. Never throws. */
  async log(entry: AuditLogEntry): Promise<void> {
    try {
      await this.write([entry]);
    } catch (error) {
      this.logger.error(
        `Failed to persist audit entry action=${entry.action} resource=${entry.resource}`,
        error instanceof Error ? error.stack : undefined,
      );
    }
  }

  /** Append several audit rows in one flush. Never throws. */
  async logMany(entries: AuditLogEntry[]): Promise<void> {
    if (entries.length === 0) return;
    try {
      await this.write(entries);
    } catch (error) {
      this.logger.error(
        `Failed to persist ${entries.length} audit entries`,
        error instanceof Error ? error.stack : undefined,
      );
    }
  }

  /**
   * Append audit rows using the caller's EntityManager so the audit rows commit
   * atomically with the clinical change they describe. Used by the ABDM services.
   */
  async logWith(em: EntityManager, entry: AuditLogEntry): Promise<AuditLog> {
    const auditLog = em.create(AuditLog, this.toEntityData(entry));
    await em.persistAndFlush(auditLog);
    return auditLog;
  }

  async find(query: AuditQuery = {}): Promise<{ logs: AuditLog[]; total: number }> {
    const where: FilterQuery<AuditLog> = {};

    if (query.action) where.action = query.action;
    if (query.resource) where.resource = query.resource;
    if (query.resourceId) where.resourceId = query.resourceId;
    if (query.userId) where.userId = query.userId;
    if (query.correlationId) where.correlationId = query.correlationId;
    if (query.from || query.to) {
      where.createdAt = {
        ...(query.from ? { $gte: query.from } : {}),
        ...(query.to ? { $lte: query.to } : {}),
      };
    }

    const limit = Math.min(500, Math.max(1, query.limit ?? 100));
    const offset = Math.max(0, query.offset ?? 0);

    const [logs, total] = await Promise.all([
      this.em.find(AuditLog, where, { orderBy: { createdAt: 'DESC' }, limit, offset }),
      this.em.count(AuditLog, where),
    ]);

    return { logs, total };
  }

  /** Full change history of one record, newest first. */
  async trailFor(resource: string, resourceId: string): Promise<AuditLog[]> {
    return this.em.find(
      AuditLog,
      { resource, resourceId },
      { orderBy: { createdAt: 'DESC' }, limit: 200 },
    );
  }

  async securityEvents(limit = 100): Promise<AuditLog[]> {
    return this.em.find(
      AuditLog,
      { action: { $in: [...SECURITY_EVENT_ACTIONS] } },
      { orderBy: { createdAt: 'DESC' }, limit },
    );
  }

  /**
   * CERT-In 180-day retention purge. Returns the number of rows deleted.
   * Intended to be driven by a daily `@Cron` job.
   */
  async purgeOlderThan(retentionDays = 180): Promise<number> {
    const cutoff = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);
    const result = await this.em.nativeDelete(AuditLog, { createdAt: { $lt: cutoff } } as any);
    this.logger.log(`Audit retention purge removed ${result} rows older than ${cutoff.toISOString()}`);
    return result;
  }

  private async write(entries: AuditLogEntry[]): Promise<void> {
    const logs = entries.map((entry) => this.em.create(AuditLog, this.toEntityData(entry)));
    await this.em.persistAndFlush(logs);
  }

  private toEntityData(entry: AuditLogEntry) {
    return {
      id: newId(),
      action: entry.action,
      resource: entry.resource,
      resourceId: entry.resourceId,
      details: entry.details ?? {},
      userId: entry.userId,
      ipAddress: entry.ipAddress,
      userAgent: entry.userAgent,
      correlationId: entry.correlationId,
      createdAt: new Date(),
    };
  }
}