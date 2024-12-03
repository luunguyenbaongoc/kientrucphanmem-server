import { Module } from '@nestjs/common';
import { ChatLogService } from './chat_log.service';
import { ChatLogController } from './chat_log.controller';
import { ChatBox, ChatBoxChatLog, ChatLog } from 'src/entities';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from '../user/user.module';
import { ChatLogContentTypeModule } from '../chat_log_content_type/chat_log_content_type.module';
import { ChatBoxModule } from '../chat_box/chat_box.module';
import { GroupMembersModule } from '../group_members/group_members.module';
import { ChatModule } from 'src/modules/socket/chat/chat.module';
import { CloudMessagingModule } from 'src/modules/firebase/cloud-messaging/cloud-messaging.module';

@Module({
  providers: [ChatLogService],
  controllers: [ChatLogController],
  imports: [
    TypeOrmModule.forFeature([ChatLog, ChatBox, ChatBoxChatLog]),
    UserModule,
    ChatLogContentTypeModule,
    ChatBoxModule,
    GroupMembersModule,
    ChatModule,
    CloudMessagingModule,
  ],
  exports: [ChatLogService],
})
export class ChatLogModule {}
