import { Module } from '@nestjs/common';
import { ChatLogService } from './chat_log.service';
import { ChatLogController } from './chat_log.controller';
import { ChatBox, ChatBoxChatLog, ChatLog } from 'src/entities';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from '../user/user.module';
import { ChatLogContentTypeModule } from '../chat_log_content_type/chat_log_content_type.module';
import { ChatBoxModule } from '../chat_box/chat_box.module';
import { GroupMembersModule } from '../group_members/group_members.module';

@Module({
  providers: [ChatLogService],
  controllers: [ChatLogController],
  imports: [
    TypeOrmModule.forFeature([ChatLog, ChatBox, ChatBoxChatLog]),
    UserModule,
    ChatLogContentTypeModule,
    ChatBoxModule,
    GroupMembersModule,
  ],
  exports: [ChatLogService],
})
export class ChatLogModule {}
