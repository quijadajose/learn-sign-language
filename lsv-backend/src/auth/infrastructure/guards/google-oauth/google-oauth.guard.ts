import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { OAuthCodeStore } from '../../oauth-code.store.js';

/**
 * BE-14: protección CSRF del login con Google.
 * - Al iniciar el flujo se genera un `state` aleatorio que se guarda en Valkey (5 min, un solo uso).
 * - El callback solo continúa si el `state` recibido existe en Valkey; se consume en ese momento.
 */
@Injectable()
export class GoogleOAuthGuard extends AuthGuard('google') {
  constructor(private readonly oauthCodeStore: OAuthCodeStore) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const http = context.switchToHttp();
    const req = http.getRequest<{
      query: Record<string, unknown>;
      oauthState?: string;
    }>();

    if (req.query?.code !== undefined || req.query?.error !== undefined) {
      const received =
        typeof req.query.state === 'string' ? req.query.state : '';
      const valid = await this.oauthCodeStore.consumeState(received);
      if (!valid) {
        throw new UnauthorizedException('errors.auth.invalidOAuthState');
      }
    } else {
      req.oauthState = await this.oauthCodeStore.createState();
    }

    return (await super.canActivate(context)) as boolean;
  }

  getAuthenticateOptions(context: ExecutionContext): { state?: string } {
    const req = context.switchToHttp().getRequest<{ oauthState?: string }>();
    return req.oauthState ? { state: req.oauthState } : {};
  }
}
