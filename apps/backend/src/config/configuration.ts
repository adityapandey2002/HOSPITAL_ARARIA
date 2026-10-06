// Configuration for the DH Araria Hospital Backend

export default () => ({
  // Application
  port: parseInt(process.env.PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  apiPrefix: 'api',
  apiVersion: '1',

  // Database
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    name: process.env.DB_NAME || 'dh_araria',
    poolSize: parseInt(process.env.DB_POOL_SIZE || '10', 10),
  },

  // ORM layer (dual-ORM over a single PostgreSQL engine — see docs/ARCHITECTURE.md).
  // Keep the sum of the three pool sizes below the server's max_connections
  // (200 in docker-compose.yml), leaving headroom for migrations and psql.
  orm: {
    drizzlePoolSize: parseInt(process.env.DRIZZLE_POOL_SIZE || '20', 10),
    mikroPoolSize: parseInt(process.env.MIKRO_POOL_SIZE || '20', 10),
    mikroDebug: process.env.MIKRO_DEBUG === 'true',
  },

  // JWT
  jwt: {
    secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
    accessTokenExpiry: process.env.JWT_ACCESS_EXPIRY || '15m',
    refreshTokenExpiry: process.env.JWT_REFRESH_EXPIRY || '7d',
    issuer: 'dh-araria',
    audience: 'dh-araria-users',
  },

  // Rate limiting
  rateLimit: {
    ttl: parseInt(process.env.RATE_LIMIT_TTL || '60000', 10), // 1 minute
    limit: parseInt(process.env.RATE_LIMIT_LIMIT || '100', 10), // 100 requests per minute
    authLimit: parseInt(process.env.RATE_LIMIT_AUTH_LIMIT || '10', 10), // 10 requests per minute for auth
  },

  // Logging
  logLevel: process.env.LOG_LEVEL || 'info',

  // File upload
  upload: {
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760', 10), // 10MB
    uploadPath: process.env.UPLOAD_PATH || './uploads',
    allowedMimeTypes: [
      'image/jpeg',
      'image/png',
      'image/webp',
      'application/pdf',
    ],
  },

  // ABDM Integration (for future phases)
  abdm: {
    sandboxBaseUrl: process.env.ABDM_SANDBOX_URL || 'https://dev.abdm.gov.in/gateway',
    productionBaseUrl: process.env.ABDM_PROD_URL || 'https://abdm.gov.in/gateway',
    clientId: process.env.ABDM_CLIENT_ID || '',
    clientSecret: process.env.ABDM_CLIENT_SECRET || '',
    fhirVersion: 'R4',
  },

  // Bhashini Integration (for future phases)
  bhashini: {
    apiKey: process.env.BHASHINI_API_KEY || '',
    apiSecret: process.env.BHASHINI_API_SECRET || '',
    pipelineSearchUrl: 'https://bhashini.gov.in/api/pipeline/search',
    pipelineConfigUrl: 'https://bhashini.gov.in/api/pipeline/config',
    pipelineComputeUrl: 'https://bhashini.gov.in/api/pipeline/compute',
  },

  // e-Pramaan Integration (for future phases)
  ePramaan: {
    authUrl: 'https://epramaan.gov.in/oauth2/authorize',
    tokenUrl: 'https://epramaan.gov.in/oauth2/token',
    userInfoUrl: 'https://epramaan.gov.in/oauth2/userinfo',
    clientId: process.env.EPRAAMAN_CLIENT_ID || '',
    clientSecret: process.env.EPRAAMAN_CLIENT_SECRET || '',
    callbackUrl: process.env.EPRAAMAN_CALLBACK_URL || 'http://localhost:3001/api/auth/epramaan/callback',
  },

  // CPGRAMS Integration (for future phases)
  cpgrams: {
    apiBaseUrl: 'https://pgportal.gov.in/api',
    apiKey: process.env.CPGRAMS_API_KEY || '',
    username: process.env.CPGRAMS_USERNAME || '',
    password: process.env.CPGRAMS_PASSWORD || '',
  },

  // e-RaktKosh Integration (for future phases)
  eRaktKosh: {
    apiBaseUrl: 'https://eraktkosh.mohfw.gov.in/BLDAHIMS/api',
    apiKey: process.env.ERAKTKOSH_API_KEY || '',
    bloodBankId: process.env.ERAKTKOSH_BLOOD_BANK_ID || '',
  },

  // CERT-In Compliance
  certIn: {
    logRetentionDays: 180,
    incidentReportingHours: 6,
    ntpServers: ['time.nic.in', 'time.nplindia.org'],
  },

  // Email (for notifications)
  email: {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_SECURE === 'true',
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.SMTP_FROM || 'noreply@dhararia.bihar.gov.in',
  },

  // Redis (for caching and sessions)
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || '',
    db: parseInt(process.env.REDIS_DB || '0', 10),
  },
});