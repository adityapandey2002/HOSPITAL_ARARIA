import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import compression from 'compression';
import * as cors from 'cors';

import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });
  
  app.useLogger(logger);
  
  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT', 3001);
  const nodeEnv = configService.get<string>('NODE_ENV', 'development');
  const frontendUrl = configService.get<string>('FRONTEND_URL', 'http://localhost:3000');

  // Security middleware
  app.use(helmet({
    contentSecurityPolicy: nodeEnv === 'production' ? undefined : false,
    crossOriginEmbedderPolicy: false,
  }));
  
  app.use(compression());
  
  // CORS configuration
  app.enableCors({
    origin: frontendUrl,
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
    }),
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
      .addBearerAuth(
        { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
        'JWT-auth',
      )
      .addTag('Auth', 'Authentication endpoints')
      .addTag('Users', 'User management')
      .addTag('Doctors', 'Doctor management')
      .addTag('Departments', 'Department management')
      .addTag('Appointments', 'Appointment booking')
      .addTag('Blood Bank', 'Blood bank inventory')
      .addTag('Grievances', 'Grievance management')
      .addTag('Notices', 'Notices and announcements')
      .addTag('Health', 'Health check endpoints')
      .build();
    
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document, {
      swaggerOptions: {
        persistAuthorization: true,
      },
    });
  }

  await app.listen(port);
  logger.log(`🚀 Application running on: http://localhost:${port}`);
  logger.log(`📚 API Documentation: http://localhost:${port}/api/docs`);
}

bootstrap();