import { Module } from '@nestjs/common';
import { FriendStatusService } from './friend_status.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FriendStatus } from 'src/entities';

@Module({
  imports: [TypeOrmModule.forFeature([FriendStatus])],
  providers: [FriendStatusService],
  exports: [FriendStatusService],
})
export class FriendStatusModule {}
