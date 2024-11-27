import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { WsException } from '@nestjs/websockets';
import { Observable } from 'rxjs';
import { AuthSocket } from '../types';
import { WsEvent } from 'src/utils/enums';

@Injectable()
export class WsJwtGuard implements CanActivate {
  static instance: WsJwtGuard;

  constructor(private jwtService: JwtService) {
    if (!WsJwtGuard.instance) {
      WsJwtGuard.instance = this;
    }
    return WsJwtGuard.instance;
  }

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    if (context.getType() !== 'ws') {
      return true;
    }

    const client: AuthSocket = context.switchToWs().getClient();
    this.validateToken(client);

    return true;
  }

  validateToken(client: AuthSocket) {
    const token =
      client.handshake.auth?.token || //client.handshake.auth for real app
      client.handshake.headers?.authorization?.split(' ')[1]; //client.handshake.headers for postman testing
    if (!token) {
      throw new WsException(WsEvent.UNAUTHORIZED);
    }
    const payload = this.jwtService.verify(token, {
      secret: process.env.ACCESS_TOKEN_SECRET,
    });
    if (!payload) {
      throw new WsException(WsEvent.UNAUTHORIZED);
    }
    client.user = payload;
    return payload;
  }
}
