import { resolveLocale, translate } from './translate';
import { legacyMessageToKey, messages, type MessageTree } from './messages';

function collectKeys(tree: MessageTree, prefix = ''): string[] {
  return Object.entries(tree).flatMap(([part, value]) => {
    const key = prefix ? `${prefix}.${part}` : part;
    return typeof value === 'string' ? [key] : collectKeys(value, key);
  });
}

describe('i18n translate', () => {
  it('resolves Accept-Language to en or es', () => {
    expect(resolveLocale('en-US,en;q=0.9')).toBe('en');
    expect(resolveLocale('es-VE,es;q=0.9')).toBe('es');
    expect(resolveLocale(undefined)).toBe('es');
  });

  it('translates keys and legacy strings', () => {
    expect(translate('errors.auth.invalidCredentials', 'es')).toBe(
      'Credenciales inválidas',
    );
    expect(translate('errors.auth.invalidCredentials', 'en')).toBe(
      'Invalid credentials',
    );
    expect(translate('Invalid credentials', 'es')).toBe(
      'Credenciales inválidas',
    );
    expect(translate('Modelo no encontrado', 'en')).toBe('Model not found');
    expect(translate('User logged in successfully', 'es')).toBe(
      'Inicio de sesión exitoso',
    );
    expect(translate('User not found.', 'es')).toBe('Usuario no encontrado');
  });

  it('interpolates params', () => {
    expect(
      translate('errors.region.defaultExists', 'es', { name: 'Caracas' }),
    ).toBe(
      'Ya existe una región base para este idioma (Caracas). Solo puede haber una región base por idioma.',
    );
    expect(translate('errors.landmarks.empty', 'en', { count: 258 })).toBe(
      'Invalid landmarks: at least one frame of 258 features is required',
    );
  });

  it('returns unknown messages unchanged', () => {
    expect(translate('Something custom', 'en')).toBe('Something custom');
  });

  it('keeps es/en catalogs and the legacy map in sync', () => {
    const esKeys = collectKeys(messages.es).sort();
    const enKeys = collectKeys(messages.en).sort();
    expect(enKeys).toEqual(esKeys);

    for (const key of Object.values(legacyMessageToKey)) {
      expect(esKeys).toContain(key);
    }
  });
});
