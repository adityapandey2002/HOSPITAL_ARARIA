// Configuration validation schema using Joi
import * as Joi from 'joi';

export const validationSchema = Joi.object({
  // Application
  PORT: Joi.number().default(3001),
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test', 'staging')
    .default('development'),
  // One origin locally; a comma-separated allowlist in deployment (production
  // domain plus Vercel preview URL). Joi's .uri() rejects the list form.
  FRONTEND_URL: Joi.string()
    .custom((value: string, helpers) => {
      const origins = value
        .split(',')
        .map((origin) => origin.trim())
        .filter(Boolean);
      const valid = origins.length > 0 && origins.every((origin) => /^https?:\/\/[^\s]+$/.test(origin));
      return valid ? value : helpers.error('string.uri');
    }, 'comma-separated URL list')
    .default('http://localhost:3000'),

  // Database — DATABASE_URL is the single required scheme. DB_* remain as
  // optional explicit overrides for the local docker-compose PostgreSQL.
  DATABASE_URL: Joi.string()
    .pattern(/^postgres(ql)?:\/\//)
    .required()
    .messages({
      'any.required':
        'DATABASE_URL is required. Set it in apps/backend/.env, e.g. postgresql://user:password@host:5432/database',
      'string.pattern.base': 'DATABASE_URL must start with postgresql:// or postgres://',
    }),
  DB_HOST: Joi.string().optional(),
  DB_PORT: Joi.number().optional(),
  DB_USERNAME: Joi.string().optional(),
  DB_PASSWORD: Joi.string().allow('').optional(),
  DB_NAME: Joi.string().optional(),
  // TLS toggle. Leave unset to auto-detect: enabled for any non-localhost host
  // (Supabase/Neon/Railway all require TLS), disabled for a local devserver.
  DB_SSL: Joi.boolean().optional(),
  DB_POOL_SIZE: Joi.number().default(10),
  // Direct/session connection for DDL. Supabase's pooler (port 6543) does not
  // support migrations; leave unset locally so it falls back to DATABASE_URL.
  DATABASE_MIGRATION_URL: Joi.string()
    .pattern(/^postgres(ql)?:\/\//)
    .optional(),

  // Dual-ORM pools (must sum to < the server's max_connections). Serverless
  // instances default to 1 each; see src/config/configuration.ts.
  DRIZZLE_POOL_SIZE: Joi.number().min(1).default(20),
  MIKRO_POOL_SIZE: Joi.number().min(1).default(20),
  MIKRO_POOL_MIN: Joi.number().min(0).default(0),
  MIKRO_DEBUG: Joi.boolean().truthy('true').falsy('false').default(false),

  // Opt-in destructive schema reset (drops the MikroORM-owned tables). Never
  // set this in production: it destroys audit_logs and ABDM records.
  ALLOW_DESTRUCTIVE_SCHEMA: Joi.boolean().truthy('true').falsy('false').default(false),

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
  EPRAAMAN_CALLBACK_URL: Joi.string()
    .uri()
    .allow('')
    .default('http://localhost:3001/api/auth/epramaan/callback'),

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
