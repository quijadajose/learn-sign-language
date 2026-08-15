import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Request, Response, NextFunction } from 'express';
import { resolveLocale, translate } from 'src/i18n';
import { extractAccessToken } from 'src/shared/infrastructure/extract-access-token';

function isModelsPath(path: string): boolean {
  return path === '/models' || path.startsWith('/models/');
}

/** Require a valid access JWT for /shared/models/* TFJS artifacts. */
export function createSharedModelsAuthMiddleware(
  configService: ConfigService,
  jwtService: JwtService,
) {
  const secret = configService.get<string>('JWT_SECRET');

  return (req: Request, res: Response, next: NextFunction) => {
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
      };
      if ((decoded.purpose ?? 'access') !== 'access') {
        throw new Error('reset token');
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
