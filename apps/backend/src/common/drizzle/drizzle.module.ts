// Drizzle Module - Global NestJS module providing Drizzle ORM instance
import { Module, Global, DynamicModule, Provider } from '@nestjs/common';
import { DrizzleService } from './drizzle.service';

export const DRIZZLE_TOKEN = 'DRIZZLE';

export type DrizzleDb = ReturnType<typeof import('drizzle-orm/node-postgres').drizzle>;

export interface DrizzleModuleOptions {
  isGlobal?: boolean;
}

@Global()
@Module({})
export class DrizzleModule {
  static forRoot(options: any = {}): DynamicModule {
    const providers: Provider[] = [
      {
        provide: DRIZZLE_TOKEN,
        useClass: DrizzleService,
      },
    ];

    return {
      module: DrizzleModule,
      providers,
      exports: [DRIZZLE_TOKEN],
      global: options.isGlobal ?? true,
    };
  }
}