import { Module } from '@nestjs/common';

import { AbdmController } from './abdm.controller';
import { AbdmService } from './abdm.service';

/**
 * ABDM (Ayushman Bharat Digital Mission) M2/M3.
 *
 * `MikroModule` and `AuditModule` are global, so their tokens (EntityManager,
 * AuditLogService) resolve without a local import.
 */
@Module({
  controllers: [AbdmController],
  providers: [AbdmService],
  exports: [AbdmService],
})
export class AbdmModule {}