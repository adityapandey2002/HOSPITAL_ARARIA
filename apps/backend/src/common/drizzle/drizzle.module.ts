/**
 * DrizzleModule
 * -------------
 * Global module that publishes two things:
 *
 *  - `DRIZZLE`   — the raw Drizzle database instance (what services inject).
 *  - `DrizzleService` — the lifecycle owner (pool create/close, health checks).
 */
import { Global, Module } from '@nestjs/common';

import { DrizzleService } from './drizzle.service';

export type { DrizzleDb } from './drizzle.service';

/** Injection token carrying the Drizzle database instance. */
export const DRIZZLE = 'DRIZZLE';

@Global()
@Module({
  providers: [
    DrizzleService,
    {
      provide: DRIZZLE,
      useFactory: (service: DrizzleService) => service.db,
      inject: [DrizzleService],
    },
  ],
  exports: [DrizzleService, DRIZZLE],
})
export class DrizzleModule {}