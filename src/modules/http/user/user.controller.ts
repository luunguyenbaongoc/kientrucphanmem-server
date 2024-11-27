import {
  Controller,
  Post,
  Get,
  Body,
  Req,
  HttpCode,
  UseGuards,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { UserService } from './user.service';
import { AddProfileDto } from '../profile/dto';
import { JwtAuthGuard } from '../auth/guards';
import { Request } from 'express';

@ApiTags('User')
@ApiBearerAuth()
@Controller('user')
export class UserController {
  constructor(private userService: UserService) {}

  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiConsumes('application/json')
  @Get('me/profiles/')
  getUserProfiles(@Req() req: Request) {
    const userId = req.user['id'];
    return this.userService.getUserProfiles(userId);
  }

  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard)
  @ApiConsumes('application/json')
  @Post('me/profiles/')
  createUserProfile(
    @Req() req: Request,
    @Body() addProfileDto: AddProfileDto,
  ) {
    const userId = req.user['id'];
    return this.userService.createUserProfile(userId, addProfileDto);
  }
}
