import { Module } from '@nestjs/common';
import { FriendController } from './friend.controller';
import { FriendService } from './friend.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Friend, FriendStatus } from 'src/entities';
import { UserModule } from '../user/user.module';
import { FriendStatusModule } from '../friend_status/friend_status.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Friend, FriendStatus]),
    UserModule,
    FriendStatusModule,
  ],
  controllers: [FriendController],
  providers: [FriendService],
})
export class FriendModule {}
