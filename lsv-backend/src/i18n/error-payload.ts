import { legacyMessageToKey } from './messages';
import { I18N_KEY_PATTERN } from './translate';

export type ApiErrorDetail = {
  field?: string;
  message: string;
};

const HTTP_ERROR_CODES: Record<number, string> = {
  400: 'BAD_REQUEST',
  401: 'UNAUTHORIZED',
  403: 'FORBIDDEN',
  404: 'NOT_FOUND',
  409: 'CONFLICT',
  429: 'TOO_MANY_REQUESTS',
  500: 'INTERNAL_ERROR',
};

function i18nKeyToCode(key: string): string {
  return key
    .replace(/^errors\./, '')
    .split('.')
    .map((part) => part.replace(/([a-z0-9])([A-Z])/g, '$1_$2').toUpperCase())
    .join('_');
}

function resolveErrorKey(message: string): string | undefined {
  if (I18N_KEY_PATTERN.test(message)) return message;
  return (
    legacyMessageToKey[message] ??
    legacyMessageToKey[message.replace(/\.+$/, '')]
  );
}

export function toBusinessErrorCode(message: unknown, status: number): string {
  if (Array.isArray(message)) return 'VALIDATION_ERROR';
  if (typeof message === 'string') {
    const key = resolveErrorKey(message);
    if (key?.startsWith('errors.')) return i18nKeyToCode(key);
  }
  return HTTP_ERROR_CODES[status] ?? `HTTP_${status}`;
}

export function detailsFromValidationMessages(
  messages: string[],
): ApiErrorDetail[] {
  return messages.map((message) => {
    const forbidden = message.match(/^property (.+?) should not exist/i);
    if (forbidden) return { field: forbidden[1], message };
    const field = message.split(/\s+/)[0];
    if (field && /^[A-Za-z_][A-Za-z0-9_]*$/.test(field)) {
      return { field, message };
    }
    return { message };
  });
}
