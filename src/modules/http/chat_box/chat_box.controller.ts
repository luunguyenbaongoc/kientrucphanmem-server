import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { ChatBoxService } from './chat_box.service';
import { AuthUser } from 'src/decorators';

@Controller('chat-box')
export class ChatBoxController {
  constructor(private chatboxService: ChatBoxService) {}

  @HttpCode(HttpStatus.OK)
  @Get('/')
  listByUserId(@AuthUser() userId: string) {
    return this.chatboxService.listByUserId(userId);
  }
}
