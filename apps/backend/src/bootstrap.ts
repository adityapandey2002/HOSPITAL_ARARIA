/**
 * Shared application bootstrap.
 *
 * `main.ts` builds the app and listens on a port; `api/index.js` builds the same
 * app and hands its Express instance to Vercel's Node runtime. Keeping the
 * middleware/prefix/pipe/filter wiring here means the two deployment shapes can
 * never drift apart.
 */
import { VersioningType, ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import type { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';
import compression from 'compression';
import { json, type NextFunction, type Request, type Response } from 'express';

import { AppModule } from './app.module';
import { isServerlessRuntime } from './config/database-url';
import { resolveFrontendOrigins } from './config/frontend-origins';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

export interface CreateAppOptions {
  /**
   * Initialise the Nest container before returning. Serverless callers must set
   * this because nothing will call `listen()`; the port-based entry point lets
   * `listen()` do it.
   */
  init?: boolean;
}

export async function createApp(options: CreateAppOptions = {}): Promise<NestExpressApplication> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
    // The default parsers are registered with Nest's implicit 100 kB limit.
    // Disabling them and mounting our own below keeps the limit a deliberate,
    // reviewable number instead of a framework default that can drift.
    bodyParser: false,
  });

  app.useLogger(new Logger('Bootstrap'));

  const configService = app.get(ConfigService);
  // `configuration.ts` exposes nested keys (port/nodeEnv/frontendUrl). Reading
  // the flat env names here would silently fall through to the defaults below.
  const nodeEnv = configService.get<string>('nodeEnv', 'development');
  const frontendUrls = resolveFrontendOrigins(
    configService.get<string>('frontendUrl', 'http://localhost:3000')
  );

  // Behind Vercel's edge there is exactly one proxy hop. Without this, Express
  // reports the proxy's address as req.ip, every visitor shares one throttler
  // bucket, and the public feedback rate limit becomes a global 5/min cap.
  if (isServerlessRuntime()) {
    app.set('trust proxy', 1);
  }

  // Security middleware
  app.use(
    helmet({
      contentSecurityPolicy: nodeEnv === 'production' ? undefined : false,
      crossOriginEmbedderPolicy: false,
    })
  );

  app.use(compression());

  // Request bodies on this API are small: the largest public payload is a
  // feedback comment capped at 2000 characters, and every other DTO is
  // shorter. A 100 kB ceiling bounds decompression work per request, which is
  // the mitigating control for the unfixed body-parser advisory (see
  // docs/SECURITY.md), and it fails fast with a 413 instead of buffering.
  //
  // The single exception is complaint submission, where an optional photo
  // travels as a base64 data URL (see docs/adr/0004-complaint-image-storage.md).
  // Only POST to that path gets the larger ceiling: body-parser marks the
  // request as read, so the global 100 kB parser skips it, and every other
  // method and route keeps the tight limit.
  app.use(
    '/api/v1/complaints',
    (req: Request, res: Response, next: NextFunction) => {
      if (req.method !== 'POST') return next();
      return json({ limit: '2mb' })(req, res, next);
    }
  );
  app.useBodyParser('json', { limit: '100kb' });
  app.useBodyParser('urlencoded', { limit: '100kb', extended: true });

  // CORS configuration. FRONTEND_URL may be a comma-separated list so the
  // Vercel preview deployment and the production domain can both be allowed.
  app.enableCors({
    origin: frontendUrls,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    credentials: true,
    maxAge: 86400, // 24 hours
  });

  // Global prefix and versioning
  app.setGlobalPrefix('api');
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  // Global pipes
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
      disableErrorMessages: nodeEnv === 'production',
    })
  );

  // Global filters and interceptors
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new TransformInterceptor(), new LoggingInterceptor());

  // Swagger documentation
  if (nodeEnv !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('DH Araria Hospital API')
      .setDescription('API documentation for District Hospital Araria Portal')
      .setVersion('1.0')
      .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'JWT-auth')
      .addTag('Auth', 'Authentication endpoints')
      .addTag('Users', 'User management')
      .addTag('Doctors', 'Doctor management')
      .addTag('Departments', 'Department management')
      .addTag('Appointments', 'Appointment booking')
      .addTag('Blood Bank', 'Blood bank inventory')
      .addTag('Grievances', 'Grievance management')
      .addTag('Feedback', 'Public department feedback')
      .addTag('Notices', 'Notices and announcements')
      .addTag('Contact', 'Public contact messages')
      .addTag('Audit', 'CERT-In audit trail')
      .addTag('Health', 'Health check endpoints')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document, {
      swaggerOptions: {
        persistAuthorization: true,
      },
    });
  }

  if (options.init) {
    await app.init();
  }

  return app;
}
