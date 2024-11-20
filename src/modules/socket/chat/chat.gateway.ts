import { Logger, UseGuards } from '@nestjs/common';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
} from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { WsJwtGuard } from '../auth/ws-jwt/ws-jwt.guard';
import { AuthSocket } from '../auth/types';
import { SocketAuthMiddleware } from '../auth/middlewares/ws.mw';

@WebSocketGateway(3002, {
  cors: {
    origin: '*',
  },
  namespace: 'chat',
})
@UseGuards(WsJwtGuard)
export class ChatGateway
  implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit
{
  afterInit(client: AuthSocket) {
    client.use(SocketAuthMiddleware() as any);
  }

  handleConnection(client: AuthSocket): void {
    Logger.log(
      `Client ${client.id} connected, User: ${JSON.stringify(client.user)}`,
    );
    // const user: IJwtPayload = client.user;
    // this.wsChatService.setTimeoutClient(client);
    // client.join(ROOM_KEY.USER(user.userId));
    // this.logger.log(
    //   `Client ${client.id} connected, User: ${JSON.stringify(user)}`,
    // );
  }

  handleDisconnect(client: Socket): void {
    // this.wsChatService.clearTimeoutClient(client);
    // this.logger.log(`Client ${client.id} disconnected`);
  }

  @SubscribeMessage('message')
  handleMessage(client: any, payload: any): string {
    console.log(`client ${client.id} sends ${payload}`);
    return 'Hello world!';
  }
}
