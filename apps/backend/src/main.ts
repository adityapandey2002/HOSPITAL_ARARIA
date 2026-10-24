/**
 * Process entry point for a long-lived server (local dev, Docker, any Node host).
 *
 * The shared wiring lives in `bootstrap.ts`; this file only owns the listener.
 */
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';

import { createApp } from './bootstrap';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await createApp();

  const configService = app.get(ConfigService);
  const port = configService.get<number>('port', 3001);

  await app.listen(port);
  logger.log(`🚀 Application running on: http://localhost:${port}`);
  logger.log(`📚 API Documentation: http://localhost:${port}/api/docs`);
}

bootstrap();
