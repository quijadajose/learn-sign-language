import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { resolveLocale, translate, type I18nParams } from './translate';

function asI18nParams(value: unknown): I18nParams | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return undefined;
  }
  return value as I18nParams;
}

function translateMessage(
  message: unknown,
  locale: ReturnType<typeof resolveLocale>,
  params?: I18nParams,
): unknown {
  if (typeof message === 'string') {
    return translate(message, locale, params);
  }
  if (Array.isArray(message)) {
    return message.map((item) => translateMessage(item, locale));
  }
  return message;
}

/**
 * Localizes HttpException messages using Accept-Language.
 * Supports i18n keys (`errors.*`), a legacy English/Spanish string map,
 * and `{ i18nParams }` for interpolated messages.
 */
@Catch(HttpException)
export class I18nHttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus?.() ?? HttpStatus.INTERNAL_SERVER_ERROR;
    const locale = resolveLocale(request.headers['accept-language']);
    const exceptionResponse = exception.getResponse();

    if (typeof exceptionResponse === 'string') {
      response.status(status).json({
        statusCode: status,
        message: translate(exceptionResponse, locale),
      });
      return;
    }

    const body = { ...(exceptionResponse as Record<string, unknown>) };
    const params = asI18nParams(body.i18nParams);
    if ('message' in body) {
      body.message = translateMessage(body.message, locale, params);
    }
    delete body.i18nParams;

    response.status(status).json(body);
  }
}
