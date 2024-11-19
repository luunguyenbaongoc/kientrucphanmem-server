import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { FriendService } from './friend.service';
import { AuthUser } from 'src/decorators';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { FindByTextDto } from './dto';

@ApiTags('Friend')
@ApiBearerAuth()
@Controller('friend')
export class FriendController {
  constructor(private friendService: FriendService) {}

  // @HttpCode(HttpStatus.CREATED)
  // @Post('/')
  // addFriend(@AuthUser() userId: string, @Body() addFriendDto: AddFriendDto) {
  //   return this.friendService.addFriend(userId, addFriendDto);
  // }

  // @HttpCode(HttpStatus.OK)
  // @Put('/')
  // updateFriend(@Body() updateFriendDto: UpdateFriendDto) {
  //   return this.friendService.updateFriend(updateFriendDto);
  // }

  @HttpCode(HttpStatus.OK)
  @Get('/')
  listFriend(@AuthUser() userId: string) {
    return this.friendService.listFriend(userId);
  }

  @HttpCode(HttpStatus.OK)
  @Delete('/delete/:delete_user_id')
  deleteFriend(
    @AuthUser() userId: string,
    @Param('delete_user_id', new ParseUUIDPipe()) delete_user_id: string,
  ) {
    return this.friendService.deleteFriend(userId, delete_user_id);
  }

  @HttpCode(HttpStatus.OK)
  @Post('/find-by-text')
  findByText(@AuthUser() userId: string, @Body() findByTextDto: FindByTextDto) {
    return this.friendService.findByText(userId, findByTextDto);
  }
}
