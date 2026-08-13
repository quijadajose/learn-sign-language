import {
  detailsFromValidationMessages,
  toBusinessErrorCode,
} from './error-payload';

describe('toBusinessErrorCode', () => {
  it('maps i18n keys to stable SCREAMING_SNAKE codes', () => {
    expect(toBusinessErrorCode('errors.quiz.notFound', 404)).toBe(
      'QUIZ_NOT_FOUND',
    );
    expect(toBusinessErrorCode('errors.auth.invalidCredentials', 401)).toBe(
      'AUTH_INVALID_CREDENTIALS',
    );
  });

  it('maps legacy English messages via the i18n catalog', () => {
    expect(toBusinessErrorCode('Invalid credentials', 401)).toBe(
      'AUTH_INVALID_CREDENTIALS',
    );
    expect(
      toBusinessErrorCode('ThrottlerException: Too Many Requests', 429),
    ).toBe('COMMON_TOO_MANY_REQUESTS');
  });

  it('uses VALIDATION_ERROR for class-validator arrays', () => {
    expect(toBusinessErrorCode(['email must be an email'], 400)).toBe(
      'VALIDATION_ERROR',
    );
  });

  it('falls back to the HTTP status name', () => {
    expect(toBusinessErrorCode('something else', 404)).toBe('NOT_FOUND');
    expect(toBusinessErrorCode(undefined, 418)).toBe('HTTP_418');
  });
});

describe('detailsFromValidationMessages', () => {
  it('extracts the property name as field', () => {
    expect(
      detailsFromValidationMessages([
        'email must be an email',
        'property role should not exist',
      ]),
    ).toEqual([
      { field: 'email', message: 'email must be an email' },
      { field: 'role', message: 'property role should not exist' },
    ]);
  });
});
