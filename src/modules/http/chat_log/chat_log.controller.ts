import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ChatLogService } from './chat_log.service';
import { InsertDto } from './dto';
import { AuthUser } from 'src/decorators';

@Controller('chat-log')
export class ChatLogController {
  constructor(private chatlogService: ChatLogService) {}

  @HttpCode(HttpStatus.OK)
  @Post('/')
  insert(@AuthUser() userId: string, @Body() insertDto: InsertDto) {
    return this.chatlogService.insert(userId, insertDto);
  }
}
