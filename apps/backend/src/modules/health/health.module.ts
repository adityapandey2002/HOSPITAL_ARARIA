import { Module } from '@nestjs/common';
import { DatabaseHealthIndicator, HealthController } from './health.controller';

@Module({
  controllers: [HealthController],
  // `DrizzleService` and `MIKRO_ORM` come from the global `DrizzleModule` and
  // `MikroModule`; the indicator itself still has to be registered to be
  // injectable.
  providers: [DatabaseHealthIndicator],
})
export class HealthModule {}
