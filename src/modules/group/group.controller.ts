import {
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Body,
  Put,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { GroupService } from './group.service';
import { AuthUser } from 'src/decorators';
import { AddGroupDto, UpdateGroupDto } from './dto';

@ApiTags('group')
@ApiBearerAuth()
@Controller('group')
export class GroupController {
  constructor(private groupService: GroupService) {}

  @HttpCode(HttpStatus.CREATED)
  @Post('/')
  addGroup(@AuthUser() userId: string, @Body() addGroupDto: AddGroupDto) {
    return this.groupService.addGroup(userId, addGroupDto);
  }

  @HttpCode(HttpStatus.OK)
  @Put('/')
  updateGroup(
    @AuthUser() userId: string,
    @Body() updateGroupDto: UpdateGroupDto,
  ) {
    return this.groupService.updateGroup(userId, updateGroupDto);
  }

  // @HttpCode(HttpStatus.NO_CONTENT)
  // @UseGuards(JwtAuthGuard)
  // @Delete('groups/:id')
  // @ApiConsumes('application/json', 'application/x-www-form-urlencoded')
  // deleteUserGroup(@Param('id') id: string) {
  //   return this.groupService.deleteGroupById(id);
  // }
}
