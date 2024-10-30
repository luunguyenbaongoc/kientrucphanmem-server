import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { FriendRequestService } from './friend_request.service';
import { AuthUser } from 'src/decorators';
import { MakeRequestDto } from './dto';

@Controller('friend-request')
export class FriendRequestController {
  constructor(private friendRequestService: FriendRequestService) {}

  @HttpCode(HttpStatus.CREATED)
  @Post('/')
  makeRequest(
    @AuthUser() userId: string,
    @Body() makeRequestDto: MakeRequestDto,
  ) {
    return this.friendRequestService.makeRequest(userId, makeRequestDto);
  }

  @HttpCode(HttpStatus.CREATED)
  @Get('/list-pending')
  listPendingRequest(@AuthUser() userId: string) {
    return this.friendRequestService.listPendingRequest(userId);
  }

  @HttpCode(HttpStatus.CREATED)
  @Get('/accept/:request_id')
  acceptRequest(@Param('request_id', new ParseUUIDPipe()) request_id: string) {
    return this.friendRequestService.acceptRequest(request_id);
  }
}
