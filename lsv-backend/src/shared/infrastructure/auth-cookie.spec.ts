import {
  ACCESS_TOKEN_SLIDE_UNDER_MS,
  ACCESS_TOKEN_TTL_MS,
  shouldSlideAccessToken,
} from './auth-cookie';

describe('shouldSlideAccessToken', () => {
  const now = Date.UTC(2026, 7, 15, 12, 0, 0);

  it('slides when remaining lifetime is under 6 hours', () => {
    const exp = Math.floor((now + ACCESS_TOKEN_SLIDE_UNDER_MS - 1) / 1000);
    expect(shouldSlideAccessToken(exp, now)).toBe(true);
  });

  it('does not slide when remaining lifetime is 6 hours or more', () => {
    const exp = Math.floor((now + ACCESS_TOKEN_SLIDE_UNDER_MS) / 1000);
    expect(shouldSlideAccessToken(exp, now)).toBe(false);
  });

  it('does not slide a fresh 12h token', () => {
    const exp = Math.floor((now + ACCESS_TOKEN_TTL_MS) / 1000);
    expect(shouldSlideAccessToken(exp, now)).toBe(false);
  });

  it('does not slide an already expired token', () => {
    const exp = Math.floor((now - 1000) / 1000);
    expect(shouldSlideAccessToken(exp, now)).toBe(false);
  });
});
