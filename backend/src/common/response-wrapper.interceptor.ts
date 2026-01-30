import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Request } from 'express';

/**
 * Wraps successful responses in { success: true, data } so the frontend
 * (which expects ApiResponse<T>) receives a consistent shape.
 */
@Injectable()
export class ResponseWrapperInterceptor implements NestInterceptor {
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<{ success: true; data: unknown }> {
    const request = context.switchToHttp().getRequest<Request>();
    const url = request.url || '';

    return next.handle().pipe(
      map((data) => {
        // Already wrapped (e.g. some controller returned { success, data })
        if (
          data &&
          typeof data === 'object' &&
          'success' in data &&
          (data as { success?: boolean }).success === true
        ) {
          return data as { success: true; data: unknown };
        }
        return { success: true as const, data };
      }),
    );
  }
}
