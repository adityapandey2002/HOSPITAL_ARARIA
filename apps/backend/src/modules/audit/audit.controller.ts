import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@dh-araria/shared';

import { AuditLogService } from '../../common/audit/audit-log.service';
import { RolesGuard } from '../../common/auth/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

import { AuditLogQueryDto } from './dto/audit-log-query.dto';

/**
 * Read-only access to the CERT-In trail.
 *
 * There is deliberately no create, update or delete route: rows are written by
 * `AuditLogService` only and removed solely by the 180-day retention purge.
 */
@ApiTags('Audit')
@Controller('audit-logs')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@ApiBearerAuth()
export class AuditController {
  constructor(private readonly auditLogService: AuditLogService) {}

  @Get()
  @ApiOperation({ summary: 'Query the audit trail (Admin only)' })
  @ApiResponse({ status: 200, description: 'Audit entries retrieved successfully' })
  @ApiQuery({ name: 'action', required: false })
  @ApiQuery({ name: 'resource', required: false })
  @ApiQuery({ name: 'resourceId', required: false })
  @ApiQuery({ name: 'userId', required: false })
  @ApiQuery({ name: 'correlationId', required: false })
  @ApiQuery({ name: 'from', required: false, description: 'ISO timestamp, inclusive' })
  @ApiQuery({ name: 'to', required: false, description: 'ISO timestamp, inclusive' })
  async findAll(@Query() query: AuditLogQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 50;

    const { logs, total } = await this.auditLogService.find({
      action: query.action,
      resource: query.resource,
      resourceId: query.resourceId,
      userId: query.userId,
      correlationId: query.correlationId,
      from: query.from ? new Date(query.from) : undefined,
      to: query.to ? new Date(query.to) : undefined,
      limit,
      offset: (page - 1) * limit,
    });

    return {
      data: logs,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  @Get('security-events')
  @ApiOperation({ summary: 'Recent authentication and authorization events (Admin only)' })
  async getSecurityEvents(@Query('limit') limit?: number) {
    const capped = Math.min(500, Math.max(1, Number(limit) || 100));
    return this.auditLogService.securityEvents(capped);
  }

  @Get('trail/:resource/:resourceId')
  @ApiOperation({ summary: 'Full change history of one record (Admin only)' })
  async getTrail(@Param('resource') resource: string, @Param('resourceId') resourceId: string) {
    return this.auditLogService.trailFor(resource, resourceId);
  }
}
