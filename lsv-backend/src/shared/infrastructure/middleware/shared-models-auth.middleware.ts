import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Request, Response, NextFunction } from 'express';
import { resolveLocale, translate } from '../../../i18n/index.js';
import { extractAccessToken } from '../extract-access-token.js';

function isModelsPath(path: string): boolean {
  return path === '/models' || path.startsWith('/models/');
}

export type AuthStateLoader = (
  userId: string,
) => Promise<{ tokenVersion: number } | null>;

/**
 * Require a valid access JWT for /shared/models/* TFJS artifacts.
 * The token must also match the user's current tokenVersion, so logout and
 * password changes revoke model access immediately (same rule as JwtAuthGuard).
 */
export function createSharedModelsAuthMiddleware(
  configService: ConfigService,
  jwtService: JwtService,
  loadAuthState: AuthStateLoader,
) {
  const secret = configService.get<string>('JWT_SECRET');

  return async (req: Request, res: Response, next: NextFunction) => {
    if (!isModelsPath(req.path || '')) {
      return next();
    }

    if (req.method === 'OPTIONS') {
      return next();
    }

    const token = extractAccessToken(req);

    if (!token || !secret) {
      const locale = resolveLocale(req.headers['accept-language']);
      return res.status(401).json({
        message: translate('errors.common.unauthorized', locale),
      });
    }

    try {
      const decoded = jwtService.verify(token, { secret }) as {
        purpose?: string;
        sub?: string;
        tokenVersion?: number;
      };
      if ((decoded.purpose ?? 'access') !== 'access') {
        throw new Error('reset token');
      }
      const authState = decoded.sub ? await loadAuthState(decoded.sub) : null;
      if (
        !authState ||
        authState.tokenVersion !== (decoded.tokenVersion ?? 0)
      ) {
        throw new Error('revoked token');
      }
      return next();
    } catch {
      const locale = resolveLocale(req.headers['accept-language']);
      return res.status(401).json({
        message: translate('errors.common.unauthorized', locale),
      });
    }
  };
}
