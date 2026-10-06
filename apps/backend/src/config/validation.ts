// Configuration validation schema using Joi
import * as Joi from 'joi';

export const validationSchema = Joi.object({
  // Application
  PORT: Joi.number().default(3001),
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
  FRONTEND_URL: Joi.string().uri().default('http://localhost:3000'),

  // Database
  DB_HOST: Joi.string().default('localhost'),
  DB_PORT: Joi.number().default(5432),
  DB_USERNAME: Joi.string().default('postgres'),
  DB_PASSWORD: Joi.string().default('postgres'),
  DB_NAME: Joi.string().default('dh_araria'),
  DB_POOL_SIZE: Joi.number().default(10),

  // Dual-ORM pools (must sum to < the server's max_connections)
  DRIZZLE_POOL_SIZE: Joi.number().default(20),
  MIKRO_POOL_SIZE: Joi.number().default(20),
  MIKRO_DEBUG: Joi.boolean().truthy('true').falsy('false').default(false),

  // JWT
  JWT_SECRET: Joi.string().min(32).required(),
  JWT_ACCESS_EXPIRY: Joi.string().default('15m'),
  JWT_REFRESH_EXPIRY: Joi.string().default('7d'),

  // Rate limiting
  RATE_LIMIT_TTL: Joi.number().default(60000),
  RATE_LIMIT_LIMIT: Joi.number().default(100),
  RATE_LIMIT_AUTH_LIMIT: Joi.number().default(10),

  // Logging
  LOG_LEVEL: Joi.string().valid('fatal', 'error', 'warn', 'info', 'debug', 'trace').default('info'),

  // File upload
  MAX_FILE_SIZE: Joi.number().default(10485760),
  UPLOAD_PATH: Joi.string().default('./uploads'),

  // ABDM (optional for Phase 1)
  ABDM_SANDBOX_URL: Joi.string().uri().allow('').default('https://dev.abdm.gov.in/gateway'),
  ABDM_PROD_URL: Joi.string().uri().allow('').default('https://abdm.gov.in/gateway'),
  ABDM_CLIENT_ID: Joi.string().allow('').default(''),
  ABDM_CLIENT_SECRET: Joi.string().allow('').default(''),

  // Bhashini (optional for Phase 1)
  BHASHINI_API_KEY: Joi.string().allow('').default(''),
  BHASHINI_API_SECRET: Joi.string().allow('').default(''),

  // e-Pramaan (optional for Phase 1)
  EPRAAMAN_CLIENT_ID: Joi.string().allow('').default(''),
  EPRAAMAN_CLIENT_SECRET: Joi.string().allow('').default(''),
  EPRAAMAN_CALLBACK_URL: Joi.string().uri().allow('').default('http://localhost:3001/api/auth/epramaan/callback'),

  // CPGRAMS (optional for Phase 1)
  CPGRAMS_API_KEY: Joi.string().allow('').default(''),
  CPGRAMS_USERNAME: Joi.string().allow('').default(''),
  CPGRAMS_PASSWORD: Joi.string().allow('').default(''),

  // e-RaktKosh (optional for Phase 1)
  ERAKTKOSH_API_KEY: Joi.string().allow('').default(''),
  ERAKTKOSH_BLOOD_BANK_ID: Joi.string().allow('').default(''),

  // Email
  SMTP_HOST: Joi.string().default('smtp.gmail.com'),
  SMTP_PORT: Joi.number().default(587),
  SMTP_SECURE: Joi.boolean().default(false),
  SMTP_USER: Joi.string().allow('').default(''),
  SMTP_PASS: Joi.string().allow('').default(''),
  SMTP_FROM: Joi.string().email().default('noreply@dhararia.bihar.gov.in'),

  // Redis
  REDIS_HOST: Joi.string().default('localhost'),
  REDIS_PORT: Joi.number().default(6379),
  REDIS_PASSWORD: Joi.string().allow('').default(''),
  REDIS_DB: Joi.number().default(0),
});