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
  handleSubscribeAdmin(@ConnectedSocket() client: Socket) {
    const user = (client.data as { user?: { role?: string } })?.user;
    const role = user?.role;

    if (role !== 'admin' && role !== 'moderator') {
      this.logger.warn(
        `Rejected admin training subscription for socket ${client.id}`,
      );
      return { status: 'forbidden' };
    }

    client.join('admin-training-updates');
    return { status: 'subscribed' };
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

  emitStatusChange(modelId: string, status: string) {
    this.server.to('admin-training-updates').emit('admin:model-status', {
      modelId,
      status,
    });
  }

  sendProgress(modelId: string, progress: number, accuracy?: number) {
    this.sendAdminProgress({ modelId, progress, accuracy });
  }

  sendAdminProgress(data: {
    modelId: string;
    progress: number;
    accuracy?: number;
  }) {
    this.server
      .to('admin-training-updates')
      .emit('admin:training-progress', data);
  }

  sendModelReady(modelId: string, modelData: Record<string, unknown>) {
    this.server.to('admin-training-updates').emit('admin:model-ready', {
      modelId,
      ...modelData,
    });
  }
}
