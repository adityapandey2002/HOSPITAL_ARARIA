// MikroORM Module - Global NestJS module providing MikroORM instance with EntityManager
import { Module, Global, DynamicModule, Provider } from '@nestjs/common';
import { MikroORM, EntityManager, EntityRepository, Options } from '@mikro-orm/core';
import { PostgreSqlDriver } from '@mikro-orm/postgresql';
import mikroOrmConfig from './mikro.config';

export const MIKRO_ORM_TOKEN = 'MIKRO_ORM';
export const ENTITY_MANAGER_TOKEN = 'ENTITY_MANAGER';

export interface MikroModuleOptions {
  isGlobal?: boolean;
}

@Global()
@Module({})
export class MikroModule {
  static forRoot(options: MikroModuleOptions = {}): DynamicModule {
    const providers: Provider[] = [
      {
        provide: MIKRO_ORM_TOKEN,
        useFactory: async () => {
          const orm = await MikroORM.init(mikroOrmConfig as any);
          return orm;
        },
      },
      {
        provide: ENTITY_MANAGER_TOKEN,
        useFactory: (orm: MikroORM) => orm.em,
        inject: [MIKRO_ORM_TOKEN],
      },
    ];

    return {
      module: MikroModule,
      providers,
      exports: [MIKRO_ORM_TOKEN, ENTITY_MANAGER_TOKEN],
      global: true,
    };
  }
}

// Repository token factory for injection
export const createRepositoryToken = (entityName: string) => `${entityName}Repository`;