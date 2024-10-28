import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { FriendService } from './friend.service';
import { AuthUser } from 'src/decorators';
import { AddFriendDto, UpdateFriendDto } from './dto';

@Controller('friend')
export class FriendController {
  constructor(private friendService: FriendService) {}

  @HttpCode(HttpStatus.CREATED)
  @Post('/')
  addFriend(@AuthUser() userId: string, @Body() addFriendDto: AddFriendDto) {
    return this.friendService.addFriend(userId, addFriendDto);
  }

  @HttpCode(HttpStatus.OK)
  @Put('/')
  updateFriend(@Body() updateFriendDto: UpdateFriendDto) {
    return this.friendService.updateFriend(updateFriendDto);
  }

  @HttpCode(HttpStatus.OK)
  @Get('list/status-code/:status-code')
  listFriendByFriendStatus(@Param('status-code') status_code: string) {
    return this.friendService.listFriendByFriendStatus(status_code);
  }
}
