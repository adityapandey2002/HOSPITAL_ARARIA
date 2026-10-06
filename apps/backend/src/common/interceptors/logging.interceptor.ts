import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest();
    const { method, url, ip, headers } = request;
    const userAgent = headers['user-agent'] || '';
    const userId = request.user?.id || 'anonymous';
    
    const now = Date.now();

    this.logger.log(`${method} ${url} - User: ${userId} - IP: ${ip} - UA: ${userAgent}`);

    return next.handle().pipe(
      tap({
        next: (response) => {
          const responseTime = Date.now() - now;
          const statusCode = context.switchToHttp().getResponse().statusCode;
          
          this.logger.log(
            `${method} ${url} - ${statusCode} - ${responseTime}ms - User: ${userId}`,
          );
        },
        error: (error) => {
          const responseTime = Date.now() - now;
          this.logger.error(
            `${method} ${url} - Error: ${error.message} - ${responseTime}ms - User: ${userId}`,
            error.stack,
          );
        },
      }),
    );
  }
}