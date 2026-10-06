import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaService } from './prisma/prisma.service';
import { JwtStrategy } from './auth/jwt.strategy';
import { RolesGuard } from './auth/roles.guard';
import { DrizzleModule } from './drizzle/drizzle.module';
import { MikroModule } from './mikro/mikro.module';
import { AuditModule } from './audit/audit.module';

@Global()
@Module({
  imports: [ConfigModule, DrizzleModule, MikroModule, AuditModule],
  providers: [PrismaService, JwtStrategy, RolesGuard],
  exports: [PrismaService, JwtStrategy, RolesGuard, DrizzleModule, MikroModule, AuditModule],
})
export class CommonModule {}