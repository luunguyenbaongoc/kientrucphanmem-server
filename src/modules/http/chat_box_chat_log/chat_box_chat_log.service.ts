import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ChatBoxChatLog } from 'src/entities';
import { Repository } from 'typeorm';

@Injectable()
export class ChatBoxChatLogService {
  constructor(
    @InjectRepository(ChatBoxChatLog)
    private chatboxChatLogRepository: Repository<ChatBoxChatLog>,
  ) {}

  // async findBy(chat_box_id: string, chat_log_)
}
