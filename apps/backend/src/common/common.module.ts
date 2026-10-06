import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AuditModule } from './audit/audit.module';
import { JwtStrategy } from './auth/jwt.strategy';
import { RolesGuard } from './auth/roles.guard';
import { DrizzleModule } from './drizzle/drizzle.module';
import { MikroModule } from './mikro/mikro.module';
import { PrismaService } from './prisma/prisma.service';

/**
 * Shared, application-wide infrastructure.
 *
 * ORM split (see docs/ARCHITECTURE.md):
 *  - PrismaService     → Auth + Users + Health (identity & session concerns)
 *  - DrizzleModule     → citizen-facing modules (departments, doctors,
 *                        appointments, blood bank, notices, grievances)
 *  - MikroModule       → clinical / ABDM modules (Unit of Work + audit hooks)
 *
 * All three share the same PostgreSQL instance; see the pool-sizing note in
 * docker-compose.yml for the `max_connections` budget.
 */
@Global()
@Module({
  imports: [ConfigModule, DrizzleModule, MikroModule, AuditModule],
  providers: [PrismaService, JwtStrategy, RolesGuard],
  exports: [
    PrismaService,
    JwtStrategy,
    RolesGuard,
    DrizzleModule,
    MikroModule,
    AuditModule,
  ],
})
export class CommonModule {}