import { Module } from '@nestjs/common';
import { WsJwtGuard } from './ws-jwt/ws-jwt.guard';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Module({})
export class WsAuthModule {}
