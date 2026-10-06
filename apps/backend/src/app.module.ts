import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { TerminusModule } from '@nestjs/terminus';
import { APP_GUARD } from '@nestjs/core';

import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { DoctorsModule } from './modules/doctors/doctors.module';
import { DepartmentsModule } from './modules/departments/departments.module';
import { AppointmentsModule } from './modules/appointments/appointments.module';
import { BloodBankModule } from './modules/blood-bank/blood-bank.module';
import { GrievancesModule } from './modules/grievances/grievances.module';
import { NoticesModule } from './modules/notices/notices.module';
import { HealthModule } from './modules/health/health.module';
import { AbdmModule } from './modules/abdm/abdm.module';
import { CommonModule } from './common/common.module';

import configuration from './config/configuration';
import { validationSchema } from './config/validation';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validationSchema,
      envFilePath: ['.env.local', '.env'],
    }),

    // Rate limiting
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        throttlers: [
          {
            ttl: configService.get<number>('rateLimit.ttl', 60000),
            limit: configService.get<number>('rateLimit.limit', 100),
          },
        ],
      }),
      inject: [ConfigService],
    }),

    // Scheduling
    ScheduleModule.forRoot(),

    // Health checks
    TerminusModule,

    // Common module (Prisma + Drizzle + MikroORM + audit)
    CommonModule,

    // Feature modules
    AuthModule,
    UsersModule,
    DoctorsModule,
    DepartmentsModule,
    AppointmentsModule,
    BloodBankModule,
    GrievancesModule,
    NoticesModule,
    HealthModule,

    // ABDM (clinical / MikroORM-backed)
    AbdmModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}