import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import {
  detailsFromValidationMessages,
  toBusinessErrorCode,
} from './error-payload';
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

function stringMessages(message: unknown): string[] | undefined {
  if (!Array.isArray(message)) return undefined;
  const strings = message.filter(
    (item): item is string => typeof item === 'string',
  );
  return strings.length ? strings : undefined;
}

/**
 * Localizes HttpException messages using Accept-Language.
 * Supports i18n keys (`errors.*`), a legacy English/Spanish string map,
 * and `{ i18nParams }` for interpolated messages.
 * Adds `code` (and `details` for ValidationPipe) so agents can self-heal.
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
        code: toBusinessErrorCode(exceptionResponse, status),
      });
      return;
    }

    const body = { ...(exceptionResponse as Record<string, unknown>) };
    const originalMessage = body.message;
    const params = asI18nParams(body.i18nParams);
    if ('message' in body) {
      body.message = translateMessage(body.message, locale, params);
    }
    delete body.i18nParams;

    if (typeof body.code !== 'string' || !body.code) {
      body.code = toBusinessErrorCode(originalMessage, status);
    }

    const rawValidation = stringMessages(originalMessage);
    if (rawValidation && !Array.isArray(body.details)) {
      body.details = detailsFromValidationMessages(rawValidation).map(
        (detail, index) => ({
          ...detail,
          message: translate(rawValidation[index], locale),
        }),
      );
    }

    response.status(status).json(body);
  }
}
