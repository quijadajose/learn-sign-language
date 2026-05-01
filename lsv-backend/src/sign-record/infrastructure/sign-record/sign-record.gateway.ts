import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
} from '@nestjs/websockets';
import { Server } from 'socket.io';
import { DocSignRecord } from './docs/sign-record.docs';
import { getCorsOrigins } from 'src/config/cors.config';
import { SignRecordNotificationPort } from '../../domain/ports/sign-record.notification.port';

@DocSignRecord()
@WebSocketGateway({
  cors: {
    origin: getCorsOrigins(),
    credentials: true,
  },
})
export class SignRecordGateway implements SignRecordNotificationPort {
  @WebSocketServer()
  server: Server;

  @SubscribeMessage('subscribeAdmin')
  handleSubscribeAdmin(client: any) {
    client.join('admin-training-updates');
    return { status: 'subscribed' };
  }

  emitStatusChange(modelId: string, status: string) {
    this.server.to('admin-training-updates').emit('admin:model-status', {
      modelId,
      status,
    });
  }

  sendProgress(modelId: string, progress: number, accuracy?: number) {
    this.server.emit(`progress:${modelId}`, {
      modelId,
      progress,
      accuracy,
    });
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

  sendModelReady(modelId: string, modelData: any) {
    this.server.emit(`ready:${modelId}`, {
      modelId,
      ...modelData,
    });
    this.server.to('admin-training-updates').emit('admin:model-ready', {
      modelId,
      ...modelData,
    });
  }
}
