// MikroORM Configuration
import { Options } from '@mikro-orm/core';
import { PostgreSqlDriver } from '@mikro-orm/postgresql';
import * as dotenv from 'dotenv';

dotenv.config();

const mikroOrmConfig: Options = {
  driver: PostgreSqlDriver,
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  dbName: process.env.DB_NAME || 'dh_araria',
  entities: ['dist/**/*.entity.js'],
  entitiesTs: ['src/**/*.entity.ts'],
  debug: process.env.NODE_ENV === 'development',
  logger: (message) => console.log(`[MikroORM] ${message}`),
  pool: {
    min: 2,
    max: parseInt(process.env.MIKRO_POOL_SIZE || '20'),
  },
  forceUtcTimezone: true,
  strict: true,
  forceEntityConstructor: false,
  allowGlobalContext: true,
};

export default mikroOrmConfig;