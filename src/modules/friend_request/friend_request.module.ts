import { Module } from '@nestjs/common';
import { FriendRequestService } from './friend_request.service';
import { FriendRequestController } from './friend_request.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Friend, FriendRequest } from 'src/entities';
import { FriendRequestStatusModule } from '../friend_request_status/friend_request_status.module';
import { UserModule } from '../user/user.module';
import { FriendModule } from '../friend/friend.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([FriendRequest, Friend]),
    FriendRequestStatusModule,
    UserModule,
    FriendModule,
  ],
  providers: [FriendRequestService],
  controllers: [FriendRequestController],
})
export class FriendRequestModule {}
