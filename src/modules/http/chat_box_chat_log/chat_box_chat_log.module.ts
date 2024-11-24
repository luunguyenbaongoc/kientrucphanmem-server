import { Module } from '@nestjs/common';
import { ChatBoxChatLogService } from './chat_box_chat_log.service';
import { ChatBoxChatLogController } from './chat_box_chat_log.controller';
import { ChatBoxChatLog } from 'src/entities';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  providers: [ChatBoxChatLogService],
  controllers: [ChatBoxChatLogController],
  imports: [TypeOrmModule.forFeature([ChatBoxChatLog])],
  exports: [ChatBoxChatLogService],
})
export class ChatBoxChatLogModule {}
