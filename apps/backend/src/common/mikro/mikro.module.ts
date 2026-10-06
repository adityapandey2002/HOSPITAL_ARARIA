/**
 * MikroModule
 * -----------
 * Global module publishing the MikroORM instance and its request-scoped
 * `EntityManager`.
 *
 * `ENTITY_MANAGER` is the handle clinical services should inject — it starts a
 * Unit of Work per resolution and is flushed/committed inside
 * `em.transactional(...)` (see AbdmService).
 */
import { Global, Module, Provider } from '@nestjs/common';
import { MikroORM } from '@mikro-orm/core';

import { createMikroOrmConfig } from './mikro.config';

export const MIKRO_ORM = 'MIKRO_ORM';
export const ENTITY_MANAGER = 'ENTITY_MANAGER';

const mikroOrmProvider: Provider = {
  provide: MIKRO_ORM,
  useFactory: async () => MikroORM.init(createMikroOrmConfig()),
};

const entityManagerProvider: Provider = {
  provide: ENTITY_MANAGER,
  useFactory: (orm: MikroORM) => orm.em.fork(),
  inject: [MIKRO_ORM],
};

@Global()
@Module({
  providers: [mikroOrmProvider, entityManagerProvider],
  exports: [MIKRO_ORM, ENTITY_MANAGER],
})
export class MikroModule {}