import { Injectable, Logger } from '@nestjs/common';

import { ClientErrorDto } from './dto/client-error.dto';

/**
 * Turns a browser error report into one structured log line.
 *
 * Vercel captures stdout; a log drain forwards it to the hospital's approved
 * monitoring service. Keeping the shape stable (`event: 'client_error'`) is what
 * makes the alert rule a one-liner instead of a parsing project.
 *
 * The stack is truncated to the first ten frames: enough to locate the
 * component, small enough to stay under log-ingest size limits.
 */
@Injectable()
export class ClientErrorsService {
  private readonly logger = new Logger('ClientError');

  record(dto: ClientErrorDto): { received: true } {
    this.logger.warn(
      JSON.stringify({
        event: 'client_error',
        message: dto.message,
        digest: dto.digest,
        path: stripQuery(dto.path),
        userAgent: dto.userAgent,
        occurredAt: dto.occurredAt ?? new Date().toISOString(),
        stack: dto.stack?.split('\n').slice(0, 10).join('\n'),
      })
    );

    return { received: true };
  }
}

/** `/feedback?phone=…` → `/feedback`: query strings can carry PII. */
function stripQuery(path: string | undefined): string | undefined {
  if (!path) return undefined;
  return path.split(/[?#]/, 1)[0].slice(0, 500);
}
