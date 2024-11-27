import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ChatBoxChatLogService } from './chat_box_chat_log.service';
import { AuthUser } from 'src/decorators';
import { GetChatBoxDetailDto } from './dto';

@Controller('chat')
export class ChatBoxChatLogController {
  constructor(private chatboxChatLogService: ChatBoxChatLogService) {}

  @HttpCode(HttpStatus.OK)
  @Post('/detail')
  getChatBoxDetailBy(
    @AuthUser() userId: string,
    @Body() getChatBoxDetailDto: GetChatBoxDetailDto,
  ) {
    return this.chatboxChatLogService.getChatBoxDetailBy(
      userId,
      getChatBoxDetailDto,
    );
  }
}
