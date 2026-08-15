import {
  ACCESS_COOKIE_NAME,
  extractAccessToken,
  readCookie,
} from './extract-access-token';

describe('extractAccessToken', () => {
  it('prefers the Authorization Bearer header', () => {
    expect(
      extractAccessToken({
        headers: {
          authorization: 'Bearer header-jwt',
          cookie: `${ACCESS_COOKIE_NAME}=cookie-jwt`,
        },
      }),
    ).toBe('header-jwt');
  });

  it('reads the access cookie when Bearer is missing', () => {
    expect(
      extractAccessToken({
        headers: { cookie: `foo=bar; ${ACCESS_COOKIE_NAME}=cookie-jwt` },
      }),
    ).toBe('cookie-jwt');
  });

  it('reads a parsed cookies map', () => {
    expect(
      extractAccessToken({
        cookies: { [ACCESS_COOKIE_NAME]: 'parsed-jwt' },
      }),
    ).toBe('parsed-jwt');
  });

  it('returns null when nothing is present', () => {
    expect(extractAccessToken({ headers: {} })).toBeNull();
  });
});

describe('readCookie', () => {
  it('decodes the cookie value', () => {
    expect(readCookie('lsv_access=a%2Fb', 'lsv_access')).toBe('a/b');
  });
});
