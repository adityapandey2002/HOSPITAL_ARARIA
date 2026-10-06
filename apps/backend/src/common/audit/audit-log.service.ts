// Audit Log Service - CERT-In compliant audit logging service
import { Injectable, Logger } from '@nestjs/common';
import { EntityManager, EntityRepository } from '@mikro-orm/core';
import { InjectRepository } from '@mikro-orm/nestjs';
import { AuditLog } from '../mikro/entities/audit-log.entity';
import { v4 as uuidv4 } from 'uuid';

export interface AuditLogEntry {
  action: string;
  resource: string;
  resourceId: string;
  details: Record<string, any>;
  userId?: string;
  ipAddress?: string;
  userAgent?: string;
  correlationId?: string;
}

@Injectable()
export class AuditLogService {
  private readonly logger = new Logger(AuditLogService.name);

  constructor(
    @InjectRepository(AuditLog)
    private readonly auditLogRepo: EntityRepository<AuditLog>,
    private readonly em: EntityManager,
  ) {}

  /**
   * Log an audit entry - CERT-In compliant
   * This method is called from entity lifecycle hooks
   */
  async log(entry: AuditLogEntry): Promise<void> {
    try {
      const auditLog = this.em.create(AuditLog, {
        id: entry.correlationId || uuidv4(),
        action: entry.action,
        resource: entry.resource,
        resourceId: entry.resourceId,
        details: entry.details,
        userId: entry.userId,
        ipAddress: entry.ipAddress,
        userAgent: entry.userAgent,
        correlationId: entry.correlationId || uuidv4(),
        createdAt: new Date(),
      });

      await this.em.persistAndFlush(auditLog);
      
      this.logger.log(`Audit: ${entry.action} on ${entry.resource} (${entry.resourceId})`);
    } catch (error) {
      this.logger.error(`Failed to write audit log: ${error.message}`, error.stack);
      // Don't throw - audit logging should not break the main operation
    }
  }

  /**
   * Batch log multiple audit entries for performance
   */
  async batchLog(entries: AuditLogEntry[]): Promise<void> {
    try {
      const auditLogs = entries.map(entry => 
        this.em.create(AuditLog, {
          id: entry.correlationId || uuidv4(),
          action: entry.action,
          resource: entry.resource,
          resourceId: entry.resourceId,
          details: entry.details,
          userId: entry.userId,
          ipAddress: entry.ipAddress,
          userAgent: entry.userAgent,
          correlationId: entry.correlationId || uuidv4(),
          createdAt: new Date(),
        })
      );

      await this.em.persistAndFlush(auditLogs);
      
      this.logger.log(`Batch audit: ${entries.length} entries logged`);
    } catch (error) {
      this.logger.error(`Failed to write batch audit log: ${error.message}`, error.stack);
    }
  }

  /**
   * Query audit logs with filters
   */
  async findLogs(filters: {
    action?: string;
    resource?: string;
    resourceId?: string;
    userId?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  }): Promise<{ logs: AuditLog[]; total: number }> {
    const where: any = {};

    if (filters.action) where.action = filters.action;
    if (filters.resource) where.resource = filters.resource;
    if (filters.resourceId) where.resourceId = filters.resourceId;
    if (filters.userId) where.userId = filters.userId;
    if (filters.startDate) where.createdAt = { $gte: filters.startDate };
    if (filters.endDate) where.createdAt = { ...where.createdAt, $lte: filters.endDate };

    const [logs, total] = await Promise.all([
      this.em.find(AuditLog, where, {
        orderBy: { createdAt: 'DESC' },
        limit: filters.limit || 100,
        offset: filters.offset || 0,
      }),
      this.em.count(AuditLog, where),
    ]);

    return { logs, total };
  }

  /**
   * Get audit trail for a specific resource
   */
  async getResourceAuditTrail(resource: string, resourceId: string): Promise<AuditLog[]> {
    return this.em.find(AuditLog, { resource, resourceId }, {
      orderBy: { createdAt: 'DESC' },
      limit: 100,
    });
  }

  /**
   * Get user activity audit trail
   */
  async getUserActivity(userId: string, limit = 50): Promise<AuditLog[]> {
    return this.em.find(AuditLog, { userId }, {
      orderBy: { createdAt: 'DESC' },
      limit,
    });
  }

  /**
   * Get security events (failed logins, unauthorized access, etc.)
   */
  async getSecurityEvents(limit = 100): Promise<AuditLog[]> {
    return this.em.find(AuditLog, {
      action: { $in: ['LOGIN_FAILED', 'UNAUTHORIZED_ACCESS', 'PERMISSION_DENIED', 'TOKEN_EXPIRED', 'TOKEN_INVALID'] },
    }, {
      orderBy: { createdAt: 'DESC' },
      limit,
    });
  }
}