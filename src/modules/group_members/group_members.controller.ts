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
import { GroupMembersService } from './group_members.service';
import { AuthUser } from 'src/decorators';
import { AddMembersDto } from './dto/add-members.dto';
import { ApiBearerAuth, ApiConsumes, ApiTags } from '@nestjs/swagger';

@ApiTags('Group Member')
@ApiBearerAuth()
@Controller('group-members')
export class GroupMembersController {
  constructor(private groupMembersService: GroupMembersService) {}

  @HttpCode(HttpStatus.OK)
  @ApiConsumes('application/json')
  @Post('/')
  addGroup(@AuthUser() userId: string, @Body() addMembersDto: AddMembersDto) {
    return this.groupMembersService.addMembers(userId, addMembersDto);
  }

  @HttpCode(HttpStatus.OK)
  @ApiConsumes('application/json')
  @Get('/list-by-user')
  findByUserId(@AuthUser() userId: string) {
    return this.groupMembersService.findByUserId(userId);
  }

  @HttpCode(HttpStatus.OK)
  @ApiConsumes('application/json')
  @Get('/list-by-group/:group_id')
  findByGroupId(@Param('group_id', new ParseUUIDPipe()) group_id: string) {
    return this.groupMembersService.findByGroupId(group_id);
  }
}
