import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { DatabaseHealthIndicator, HealthController } from './health.controller';
import { PrismaService } from '../../common/prisma/prisma.service';

@Module({
  imports: [TerminusModule],
  controllers: [HealthController],
  // `PrismaService` and `DrizzleService` come from the global `CommonModule`;
  // the indicator itself still has to be registered to be injectable.
  providers: [PrismaService, DatabaseHealthIndicator],
})
export class HealthModule {}
