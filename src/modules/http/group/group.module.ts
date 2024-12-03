import { forwardRef, Module } from '@nestjs/common';
import { GroupController } from './group.controller';
import { GroupService } from './group.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from '../user/user.module';
import { ChatBox, Group } from 'src/entities';
import { GroupStatusModule } from '../group_status/group_status.module';
import { GroupStatus } from 'src/entities/group_status.entity';
import { GroupMembersModule } from '../group_members/group_members.module';
import { FriendModule } from '../friend/friend.module';
import { ChatModule } from 'src/modules/socket/chat/chat.module';
import { CloudMessagingModule } from 'src/modules/firebase/cloud-messaging/cloud-messaging.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Group, GroupStatus, ChatBox]),
    GroupMembersModule,
    UserModule,
    GroupStatusModule,
    FriendModule,
    ChatModule,
    CloudMessagingModule,
  ],
  exports: [GroupService],
  controllers: [GroupController],
  providers: [GroupService],
})
export class GroupModule {}
