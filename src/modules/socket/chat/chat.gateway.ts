import { Logger, UseGuards } from '@nestjs/common';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server } from 'socket.io';
import { WsJwtGuard } from '../auth/ws-jwt/ws-jwt.guard';
import { AuthSocket } from '../auth/types';
import { SocketAuthMiddleware } from '../auth/middlewares/ws.mw';
import { WsEvent } from 'src/utils/enums';

@WebSocketGateway(3002, {
  cors: {
    origin: '*',
  },
})
@UseGuards(WsJwtGuard)
export class ChatGateway
  implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit
{
  @WebSocketServer()
  private readonly server: Server;
  private readonly logger = new Logger(ChatGateway.name);

  afterInit(client: AuthSocket) {
    // this.logger.log(client.id);
    client.use(SocketAuthMiddleware() as any);
  }

  handleConnection(client: AuthSocket): void {
    const user = client.user;
    // this.wsChatService.setTimeoutClient(client);
    client.join(user.id);
    this.logger.log(
      `Client ${client.id} connected, User: ${JSON.stringify(client.user)}`,
    );
  }

  handleDisconnect(client: AuthSocket): void {
    // this.wsChatService.clearTimeoutClient(client);
    this.logger.log(`Client ${client.id} disconnected`);
  }

  // @SubscribeMessage('message')
  // handleMessage(client: any, payload: any): string {
  //   console.log(`client ${client.id} sends ${payload}`);
  //   return 'Hello world!';
  // }

  sendCreatedMessage(
    ownerId: string,
    toId: string,
    payloadId: string,
    isGroupChat: boolean,
  ) {
    this.server
      .to(toId)
      .except(ownerId)
      .emit(WsEvent.RECEIVE_MESSAGE, { payloadId, isGroupChat });
  }

  sendMessageToOwner(toId: string, payloadId: string, isGroupChat: boolean) {
    this.server
      .to(toId)
      .emit(WsEvent.RECEIVE_MESSAGE, { payloadId, isGroupChat });
  }
}
