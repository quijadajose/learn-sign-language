import {
  DEFAULT_LOCALE,
  legacyMessageToKey,
  messages,
  type AppLocale,
  type MessageTree,
} from './messages';

export const I18N_KEY_PATTERN = /^(errors|success)(\.[a-zA-Z0-9_]+)+$/;

function lookup(tree: MessageTree, key: string): string | undefined {
  const parts = key.split('.');
  let current: string | MessageTree | undefined = tree;
  for (const part of parts) {
    if (!current || typeof current === 'string') return undefined;
    current = current[part];
  }
  return typeof current === 'string' ? current : undefined;
}

export function resolveLocale(acceptLanguage?: string | string[]): AppLocale {
  const header = Array.isArray(acceptLanguage)
    ? acceptLanguage[0]
    : acceptLanguage;
  if (!header) return DEFAULT_LOCALE;

  const preferred = header
    .split(',')
    .map((part) => {
      const [tag, qValue] = part.trim().split(';q=');
      return {
        tag: tag.toLowerCase(),
        q: qValue ? Number(qValue) : 1,
      };
    })
    .sort((a, b) => b.q - a.q);

  for (const { tag } of preferred) {
    if (tag.startsWith('en')) return 'en';
    if (tag.startsWith('es')) return 'es';
  }

  return DEFAULT_LOCALE;
}

export type I18nParams = Record<string, string | number>;

/** Nest exception/response body that carries interpolation params. */
export function withI18nParams(key: string, params: I18nParams) {
  return { message: key, i18nParams: params };
}

export function translate(
  keyOrMessage: string,
  locale: AppLocale = DEFAULT_LOCALE,
  params?: I18nParams,
): string {
  const key = I18N_KEY_PATTERN.test(keyOrMessage)
    ? keyOrMessage
    : (legacyMessageToKey[keyOrMessage] ??
      legacyMessageToKey[keyOrMessage.replace(/\.+$/, '')]);

  if (!key) return keyOrMessage;

  const translated =
    lookup(messages[locale], key) ??
    lookup(messages[DEFAULT_LOCALE], key) ??
    keyOrMessage;

  if (!params) return translated;

  return Object.entries(params).reduce(
    (text, [name, value]) =>
      text.replace(new RegExp(`\\{${name}\\}`, 'g'), String(value)),
    translated,
  );
}

export function isI18nKey(value: string): boolean {
  return I18N_KEY_PATTERN.test(value) || value in legacyMessageToKey;
}
