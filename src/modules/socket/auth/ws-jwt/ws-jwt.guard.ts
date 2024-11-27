import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { WsException } from '@nestjs/websockets';
import { Observable } from 'rxjs';
import { AuthSocket } from '../types';

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
    const authorization =
      client.handshake.auth?.authorization || //client.handshake.auth for real app
      client.handshake.headers.authorization; //client.handshake.headers for postman testing
    console.log(authorization);
    if (!authorization) {
      throw new WsException('Unauthorized');
    }
    const token: string = authorization.split(' ')[1];
    const payload = this.jwtService.verify(token, {
      secret: process.env.ACCESS_TOKEN_SECRET,
    });
    if (!payload) {
      throw new WsException('Unauthorized');
    }
    client.user = payload;
    return payload;
  }
}
