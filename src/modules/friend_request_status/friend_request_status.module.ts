import { Module } from '@nestjs/common';
import { FriendRequestStatusService } from './friend_request_status.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FriendRequestStatus } from 'src/entities';

@Module({
  imports: [TypeOrmModule.forFeature([FriendRequestStatus])],
  providers: [FriendRequestStatusService],
  exports: [FriendRequestStatusService],
})
export class FriendRequestStatusModule {}
