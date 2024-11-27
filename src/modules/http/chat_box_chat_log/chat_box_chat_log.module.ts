import { Module } from '@nestjs/common';
import { ChatBoxChatLogService } from './chat_box_chat_log.service';
import { ChatBoxChatLogController } from './chat_box_chat_log.controller';
import { ChatBoxChatLog } from 'src/entities';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GroupModule } from '../group/group.module';
import { UserModule } from '../user/user.module';
import { ChatBoxModule } from '../chat_box/chat_box.module';

@Module({
  providers: [ChatBoxChatLogService],
  controllers: [ChatBoxChatLogController],
  imports: [
    TypeOrmModule.forFeature([ChatBoxChatLog]),
    GroupModule,
    UserModule,
    ChatBoxModule,
  ],
  exports: [ChatBoxChatLogService],
})
export class ChatBoxChatLogModule {}
