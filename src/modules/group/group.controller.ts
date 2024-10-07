import {
  Controller,
  HttpCode,
  HttpStatus,
  UseGuards,
  Req,
  Post,
  Get,
  Body,
} from '@nestjs/common';
import { 
  ApiTags, 
  ApiBearerAuth, 
  ApiConsumes 
} from '@nestjs/swagger';
import { Request } from 'express';
import { GroupService } from './group.service';
import { JwtAuthGuard } from '../auth/guards';
import { CreateGroupDto } from './dto';

@ApiTags('group')
@ApiBearerAuth()
@Controller('group')
export class GroupController {
  constructor(private groupService: GroupService) {}

  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @Post('groups')
  @ApiConsumes('application/json', 'application/x-www-form-urlencoded')
  createGroup(@Req() req: Request, @Body() createGroupDto: CreateGroupDto) {
    const userInfo = req.user;
    return this.groupService.createGroup(userInfo['id'], createGroupDto);
  }

  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @Get('groups')
  @ApiConsumes('application/json', 'application/x-www-form-urlencoded')
  getUserGroups(@Req() req: Request) {
    const userInfo = req.user;
    return this.groupService.findByUserId(userInfo['id'])
  }
}
