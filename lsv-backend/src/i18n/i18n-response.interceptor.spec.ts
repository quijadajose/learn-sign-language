import { of, lastValueFrom } from 'rxjs';
import { I18nResponseInterceptor } from './i18n-response.interceptor';

function mockContext(acceptLanguage?: string) {
  return {
    switchToHttp: () => ({
      getRequest: () => ({
        headers: acceptLanguage ? { 'accept-language': acceptLanguage } : {},
      }),
    }),
  } as never;
}

describe('I18nResponseInterceptor', () => {
  const interceptor = new I18nResponseInterceptor();

  it('translates login success to Spanish by default', async () => {
    const result$ = interceptor.intercept(mockContext(), {
      handle: () =>
        of({ message: 'User logged in successfully', data: { token: 'x' } }),
    });
    await expect(lastValueFrom(result$)).resolves.toEqual({
      message: 'Inicio de sesión exitoso',
      data: { token: 'x' },
    });
  });

  it('keeps English when Accept-Language is en', async () => {
    const result$ = interceptor.intercept(mockContext('en'), {
      handle: () => of({ message: 'User logged in successfully', data: {} }),
    });
    await expect(lastValueFrom(result$)).resolves.toEqual({
      message: 'User logged in successfully',
      data: {},
    });
  });

  it('interpolates i18nParams and strips them from the payload', async () => {
    const result$ = interceptor.intercept(mockContext('es'), {
      handle: () =>
        of({
          message: 'success.languageAssignedToRegions',
          i18nParams: { count: 3 },
          updated: 3,
        }),
    });
    await expect(lastValueFrom(result$)).resolves.toEqual({
      message: 'Idioma asignado a 3 regiones',
      updated: 3,
    });
  });

  it('leaves payloads without message unchanged', async () => {
    const payload = { email: 'a@b.com' };
    const result$ = interceptor.intercept(mockContext('es'), {
      handle: () => of(payload),
    });
    await expect(lastValueFrom(result$)).resolves.toBe(payload);
  });
});
