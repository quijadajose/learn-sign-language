import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Request } from 'express';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { resolveLocale, translate, type I18nParams } from './translate';

/**
 * Localizes `{ message }` on successful JSON envelopes using Accept-Language.
 * Exception messages are handled by I18nHttpExceptionFilter.
 */
@Injectable()
export class I18nResponseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<Request>();
    const locale = resolveLocale(request.headers['accept-language']);

    return next.handle().pipe(
      map((data) => {
        if (!data || typeof data !== 'object' || Array.isArray(data)) {
          return data;
        }
        const body = data as Record<string, unknown>;
        if (typeof body.message !== 'string') {
          return data;
        }
        const params =
          body.i18nParams &&
          typeof body.i18nParams === 'object' &&
          !Array.isArray(body.i18nParams)
            ? (body.i18nParams as I18nParams)
            : undefined;
        const { i18nParams: _i18nParams, ...rest } = body;
        return {
          ...rest,
          message: translate(body.message, locale, params),
        };
      }),
    );
  }
}
