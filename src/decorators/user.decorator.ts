import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
export type RequestBody = {
  action: {
    name: string;
  };
  request_query: string;
  session_variables: {
    'x-hasura-role': string;
    'x-hasura-user-id': string;
    refreshToken: string;
  };
};
export const AuthUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user.id;
  },
);

export const RefreshToken = createParamDecorator(
  (data: string, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<Request>();
    return request.headers.refresh_token;
  },
);
