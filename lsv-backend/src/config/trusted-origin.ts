import { NextFunction, Request, Response } from 'express';
import { getCorsOrigins } from './cors.config';
import { extractAccessToken } from 'src/shared/infrastructure/extract-access-token';
import { resolveLocale, translate } from 'src/i18n';

const SAFE = new Set(['GET', 'HEAD', 'OPTIONS']);

/**
 * Cookie-authenticated mutations must come from an allowed Origin.
 * Bearer clients (e2e, trainer callbacks) skip this check.
 */
export function requireTrustedOrigin(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (SAFE.has(req.method.toUpperCase())) {
    return next();
  }

  const header = req.headers.authorization;
  const hasBearer = typeof header === 'string' && header.startsWith('Bearer ');
  if (hasBearer) {
    return next();
  }

  const cookieToken = extractAccessToken({
    headers: { cookie: req.headers.cookie },
    cookies: req.cookies,
  });
  if (!cookieToken) {
    return next();
  }

  const origin = req.headers.origin;
  if (typeof origin === 'string' && getCorsOrigins().includes(origin)) {
    return next();
  }

  const locale = resolveLocale(req.headers['accept-language']);
  res.status(403).json({
    message: translate('errors.common.forbidden', locale),
  });
}
