import { CookieOptions, Response } from 'express';
import { ACCESS_COOKIE_NAME } from 'src/shared/infrastructure/extract-access-token';

function cookieOptions(): CookieOptions {
  const isProd = process.env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    path: '/',
    maxAge: 12 * 60 * 60 * 1000,
  };
}

export function attachAuthCookie(res: Response, token: string): void {
  res.cookie(ACCESS_COOKIE_NAME, token, cookieOptions());
}

export function clearAuthCookie(res: Response): void {
  res.clearCookie(ACCESS_COOKIE_NAME, cookieOptions());
}
