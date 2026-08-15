import { CookieOptions, Response } from 'express';
import { ACCESS_COOKIE_NAME } from 'src/shared/infrastructure/extract-access-token';

export const ACCESS_TOKEN_TTL = '12h' as const;
export const ACCESS_TOKEN_TTL_MS = 12 * 60 * 60 * 1000;
export const ACCESS_TOKEN_SLIDE_UNDER_MS = 6 * 60 * 60 * 1000;

function cookieOptions(): CookieOptions {
  const isProd = process.env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    path: '/',
    maxAge: ACCESS_TOKEN_TTL_MS,
  };
}

export function shouldSlideAccessToken(
  expSeconds: number | undefined,
  nowMs = Date.now(),
): boolean {
  if (typeof expSeconds !== 'number' || !Number.isFinite(expSeconds)) {
    return false;
  }
  const remainingMs = expSeconds * 1000 - nowMs;
  return remainingMs > 0 && remainingMs < ACCESS_TOKEN_SLIDE_UNDER_MS;
}

export function attachAuthCookie(res: Response, token: string): void {
  res.cookie(ACCESS_COOKIE_NAME, token, cookieOptions());
}

export function clearAuthCookie(res: Response): void {
  res.clearCookie(ACCESS_COOKIE_NAME, cookieOptions());
}
