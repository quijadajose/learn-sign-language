import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Request, Response, NextFunction } from 'express';
import { resolveLocale, translate } from 'src/i18n';

function isModelsPath(path: string): boolean {
  // Mounted at `/shared` → Express path is `/models/...`
  return path === '/models' || path.startsWith('/models/');
}

/** Require a valid Bearer JWT for /shared/models/* TFJS artifacts. */
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

    const header = req.headers.authorization;
    const token =
      typeof header === 'string' && header.startsWith('Bearer ')
        ? header.slice(7).trim()
        : '';

    if (!token || !secret) {
      const locale = resolveLocale(req.headers['accept-language']);
      return res.status(401).json({
        message: translate('errors.common.unauthorized', locale),
      });
    }

    try {
      jwtService.verify(token, { secret });
      return next();
    } catch {
      const locale = resolveLocale(req.headers['accept-language']);
      return res.status(401).json({
        message: translate('errors.common.unauthorized', locale),
      });
    }
  };
}
