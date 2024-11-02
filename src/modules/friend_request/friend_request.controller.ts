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
import { FriendRequestStatusCode } from 'src/utils/enums';
import { ApiConsumes, ApiTags } from '@nestjs/swagger';

@ApiTags('Friend Request')
@Controller('friend-request')
export class FriendRequestController {
  constructor(private friendRequestService: FriendRequestService) {}

  @HttpCode(HttpStatus.CREATED)
  @ApiConsumes('application/json')
  @Post('/')
  makeRequest(
    @AuthUser() userId: string,
    @Body() makeRequestDto: MakeRequestDto,
  ) {
    return this.friendRequestService.makeRequest(userId, makeRequestDto);
  }

  @HttpCode(HttpStatus.OK)
  @Get('/list-pending')
  listPendingRequest(@AuthUser() userId: string) {
    return this.friendRequestService.listPendingRequest(userId);
  }

  @HttpCode(HttpStatus.OK)
  @Get('/accept/:request_id')
  acceptRequest(@Param('request_id', new ParseUUIDPipe()) request_id: string) {
    return this.friendRequestService.acceptRequest(request_id);
  }

  @HttpCode(HttpStatus.OK)
  @Get('/decline/:request_id')
  declineRequest(@Param('request_id', new ParseUUIDPipe()) request_id: string) {
    return this.friendRequestService.updateRequest({
      id: request_id,
      status_code: FriendRequestStatusCode.DECLINED,
    });
  }
}
