import { ExecutionContext, Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

/**
 * Rate limiting global, solo para HTTP.
 *
 * - En tests se omite (el Valkey compartido daría 429 en los e2e).
 * - En WebSocket se omite: ThrottlerGuard escribe cabeceras en la respuesta HTTP,
 *   que no existe en un contexto `ws`, y fallaba en cada `subscribeAdmin`. Los sockets
 *   ya exigen un token válido al conectar (SignRecordGateway.handleConnection).
 */
@Injectable()
export class AppThrottlerGuard extends ThrottlerGuard {
  protected async shouldSkip(context: ExecutionContext): Promise<boolean> {
    if (process.env.NODE_ENV === 'test') {
      return true;
    }
    if (context.getType() !== 'http') {
      return true;
    }
    return super.shouldSkip(context);
  }
}
