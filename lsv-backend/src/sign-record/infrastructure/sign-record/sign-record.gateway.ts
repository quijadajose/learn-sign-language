import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  ConnectedSocket,
  OnGatewayConnection,
} from '@nestjs/websockets';
import { Inject, Logger } from '@nestjs/common';
import { UserRepositoryInterface } from '../../../auth/domain/ports/user.repository.interface/user.repository.interface.js';
import { Server, Socket } from 'socket.io';
import { DocSignRecord } from './docs/sign-record.docs.js';
import { getCorsOrigins } from '../../../config/cors.config.js';
import { SignRecordNotificationPort } from '../../domain/ports/sign-record.notification.port.js';
import { TokenService } from '../../../auth/domain/ports/token.service/token.service.interface.js';
import { extractAccessToken } from '../../../shared/infrastructure/extract-access-token.js';
import { ModeratorPermissionRepositoryInterface } from '../../../moderator/domain/ports/moderator-permission.repository.interface.js';

/** Admins: reciben todos los eventos de entrenamiento. */
const ADMIN_ROOM = 'admin-training-updates';
/** Moderadores: solo los eventos de sus idiomas (BE-16). */
const languageRoom = (languageId: string) =>
  `admin-training-lang:${languageId}`;

@DocSignRecord()
@WebSocketGateway({
  cors: {
    origin: getCorsOrigins(),
    credentials: true,
  },
})
export class SignRecordGateway
  implements SignRecordNotificationPort, OnGatewayConnection
{
  private readonly logger = new Logger(SignRecordGateway.name);

  @WebSocketServer()
  server: Server;

  constructor(
    @Inject('TokenService')
    private readonly tokenService: TokenService,
    @Inject('UserRepositoryInterface')
    private readonly userRepository: UserRepositoryInterface,
    @Inject('ModeratorPermissionRepositoryInterface')
    private readonly moderatorPermissionRepository: ModeratorPermissionRepositoryInterface,
  ) {}

  async handleConnection(client: Socket): Promise<void> {
    const token = this.extractToken(client);
    if (!token) {
      this.logger.warn(`Rejected unauthenticated socket ${client.id}`);
      client.disconnect(true);
      return;
    }
    try {
      const payload = this.tokenService.verifyToken(token);
      // BE-16: el socket solo vive mientras la sesión siga vigente y usa el rol actual de la BD,
      // no el que llevaba el token (válido 12 h).
      const authState = payload.sub
        ? await this.userRepository.findAuthStateById(payload.sub)
        : null;
      if (
        !authState ||
        authState.tokenVersion !== (payload.tokenVersion ?? 0)
      ) {
        this.logger.warn(`Rejected revoked session for socket ${client.id}`);
        client.disconnect(true);
        return;
      }
      (client.data as { user?: unknown }).user = {
        ...payload,
        role: authState.role,
      };
    } catch {
      this.logger.warn(`Rejected invalid token for socket ${client.id}`);
      client.disconnect(true);
    }
  }

  @SubscribeMessage('subscribeAdmin')
  async handleSubscribeAdmin(@ConnectedSocket() client: Socket) {
    const user = (client.data as { user?: { sub?: string; role?: string } })
      ?.user;
    const role = user?.role;

    if (role === 'admin') {
      client.join(ADMIN_ROOM);
      return { status: 'subscribed' };
    }

    if (role === 'moderator' && user?.sub) {
      const languageIds =
        await this.moderatorPermissionRepository.findAccessibleLanguageIds(
          user.sub,
        );
      for (const languageId of languageIds) {
        client.join(languageRoom(languageId));
      }
      return { status: 'subscribed' };
    }

    this.logger.warn(
      `Rejected admin training subscription for socket ${client.id}`,
    );
    return { status: 'forbidden' };
  }

  private extractToken(client: Socket): string | null {
    const authToken = (client.handshake.auth as { token?: string })?.token;
    if (typeof authToken === 'string' && authToken.length > 0) {
      return authToken;
    }

    const header = client.handshake.headers?.authorization;
    if (typeof header === 'string' && header.startsWith('Bearer ')) {
      return header.slice(7).trim();
    }

    const cookieHeader = client.handshake.headers?.cookie;
    return extractAccessToken({
      headers: {
        cookie: typeof cookieHeader === 'string' ? cookieHeader : undefined,
      },
    });
  }

  /** Admins siempre reciben; moderadores solo si el modelo es de uno de sus idiomas. */
  private emitTraining(
    languageId: string | null,
    event: string,
    payload: Record<string, unknown>,
  ) {
    this.server.to(ADMIN_ROOM).emit(event, payload);
    if (languageId) {
      this.server.to(languageRoom(languageId)).emit(event, payload);
    }
  }

  emitStatusChange(modelId: string, languageId: string | null, status: string) {
    this.emitTraining(languageId, 'admin:model-status', { modelId, status });
  }

  sendProgress(
    modelId: string,
    languageId: string | null,
    progress: number,
    accuracy?: number,
  ) {
    this.emitTraining(languageId, 'admin:training-progress', {
      modelId,
      progress,
      accuracy,
    });
  }

  sendModelReady(
    modelId: string,
    languageId: string | null,
    modelData: Record<string, unknown>,
  ) {
    this.emitTraining(languageId, 'admin:model-ready', {
      modelId,
      ...modelData,
    });
  }
}
