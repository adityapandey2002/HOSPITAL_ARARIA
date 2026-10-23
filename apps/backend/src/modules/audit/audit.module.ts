import { Module } from '@nestjs/common';

import { AuditController } from './audit.controller';

/** Read-side HTTP surface for the global `AuditLogService`. */
@Module({
  controllers: [AuditController],
})
export class AuditQueryModule {}
