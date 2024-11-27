import { Socket } from 'socket.io';

export type SocketIOMiddleWare = {
  (client: Socket, next: (err?: Error) => void);
};

export interface AuthSocket extends Socket {
  user: {
    id: string;
    phone: string;
  };
}
