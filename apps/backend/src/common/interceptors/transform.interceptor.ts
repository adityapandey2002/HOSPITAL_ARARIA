import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable, map } from 'rxjs';
import { ApiResponse, PaginationMeta } from '@dh-araria/shared/types';

export interface ResponseTransform<T> {
  data: T;
  meta?: PaginationMeta;
}

@Injectable()
export class TransformInterceptor<T>
  implements NestInterceptor<T, ApiResponse<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<ApiResponse<T>> {
    return next.handle().pipe(
      map((data: unknown) => {
        const response = data as ResponseTransform<T>;
        
        // If the response already has the expected structure, return as is
        if (response && typeof response === 'object' && 'success' in response) {
          return response as ApiResponse<T>;
        }

        // Otherwise, wrap in standard response format
        return {
          success: true,
          data: response?.data ?? response,
          meta: response?.meta,
        } as ApiResponse<T>;
      }),
    );
  }
}