import { Module, ValidationPipe } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TypeOrmConfigService } from './configs/typeorm.config';
import { UserModule } from './modules/http/user/user.module';
import { AuthModule } from './modules/http/auth/auth.module';
import { APP_GUARD, APP_PIPE } from '@nestjs/core';
import { PassportModule } from '@nestjs/passport';
import { JwtAuthGuard } from './modules/http/auth/guards';
import { ProfileModule } from './modules/http/profile/profile.module';
import { GroupModule } from './modules/http/group/group.module';
import { FriendModule } from './modules/http/friend/friend.module';
import { GroupMembersModule } from './modules/http/group_members/group_members.module';
import { FriendRequestModule } from './modules/http/friend_request/friend_request.module';
import { ChatModule } from './modules/socket/chat/chat.module';
import { WsAuthModule } from './modules/socket/auth/auth.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useClass: TypeOrmConfigService,
    }),
    UserModule,
    AuthModule,
    PassportModule,
    ProfileModule,
    GroupModule,
    FriendModule,
    GroupMembersModule,
    FriendRequestModule,
    ChatModule,
    WsAuthModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_PIPE,
      useClass: ValidationPipe,
    },
  ],
})
export class AppModule {}
