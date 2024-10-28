import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { GroupMembersService } from './group_members.service';
import { AuthUser } from 'src/decorators';
import { AddMembersDto } from './dto/add-members.dto';

@Controller('group-members')
export class GroupMembersController {
  constructor(private groupMembersService: GroupMembersService) {}

  @HttpCode(HttpStatus.CREATED)
  @Post('/')
  addGroup(@AuthUser() userId: string, @Body() addMembersDto: AddMembersDto) {
    return this.groupMembersService.addMembers(userId, addMembersDto);
  }
}
