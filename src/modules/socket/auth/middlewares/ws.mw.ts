import { WsJwtGuard } from '../ws-jwt/ws-jwt.guard';
import { AuthSocket, SocketIOMiddleWare } from '../types';

export const SocketAuthMiddleware = (): SocketIOMiddleWare => {
  const wsJwtGuardInstance = WsJwtGuard.instance;

  return (client: AuthSocket, next) => {
    try {
      wsJwtGuardInstance.validateToken(client);
      next();
    } catch (error) {
      next(error);
    }
  };
};
