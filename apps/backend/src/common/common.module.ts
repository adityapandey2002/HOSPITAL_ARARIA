import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaService } from './prisma/prisma.service';
import { JwtStrategy } from './auth/jwt.strategy';
import { RolesGuard } from './auth/roles.guard';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [PrismaService, JwtStrategy, RolesGuard],
  exports: [PrismaService, JwtStrategy, RolesGuard],
})
export class CommonModule {}