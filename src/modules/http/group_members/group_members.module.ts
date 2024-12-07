import { forwardRef, Module } from '@nestjs/common';
import { GroupMembersController } from './group_members.controller';
import { GroupMembersService } from './group_members.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatBox, Group } from 'src/entities';
import { UserModule } from '../user/user.module';
import { GroupStatusModule } from '../group_status/group_status.module';
import { GroupModule } from '../group/group.module';
import { GroupStatus } from 'src/entities/group_status.entity';
import { GroupMembers } from 'src/entities/group_members.entity';
import { FriendModule } from '../friend/friend.module';
import { ChatModule } from 'src/modules/socket/chat/chat.module';
import { CloudMessagingModule } from 'src/modules/firebase/cloud-messaging/cloud-messaging.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([GroupMembers, Group, GroupStatus, ChatBox]),
    UserModule,
    GroupStatusModule,
    FriendModule,
    forwardRef(() => GroupModule),
    ChatModule,
    CloudMessagingModule,
  ],
  controllers: [GroupMembersController],
  providers: [GroupMembersService],
  exports: [GroupMembersService],
})
export class GroupMembersModule {}
