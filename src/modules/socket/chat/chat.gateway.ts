import { UseGuards } from '@nestjs/common';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
} from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { JwtAuthGuard } from 'src/modules/auth/guards';

@WebSocketGateway(3002, {
  cors: {
    origin: '*',
  },
  namespace: 'chat',
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  handleConnection(client: Socket): void {
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
