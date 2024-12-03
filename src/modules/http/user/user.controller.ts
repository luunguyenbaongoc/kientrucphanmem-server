import {
  Controller,
  Post,
  Get,
  Body,
  Req,
  HttpCode,
  UseGuards,
  HttpStatus,
  Param,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { UserService } from './user.service';
import { AddProfileDto } from '../profile/dto';
import { JwtAuthGuard } from '../auth/guards';
import { Request } from 'express';
import { AuthUser, Public } from 'src/decorators';
import { FirebaseTokenDto } from './dto';

@ApiTags('User')
@ApiBearerAuth()
@Controller('user')
export class UserController {
  constructor(private userService: UserService) {}

  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiConsumes('application/json')
  @Get('me/profiles/')
  getUserProfiles(@AuthUser() userId: string) {
    // const userId = req.user['id'];
    return this.userService.getUserProfiles(userId);
  }

  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard)
  @ApiConsumes('application/json')
  @Post('me/profiles/')
  createUserProfile(@Req() req: Request, @Body() addProfileDto: AddProfileDto) {
    const userId = req.user['id'];
    return this.userService.createUserProfile(userId, addProfileDto);
  }

  @HttpCode(HttpStatus.OK)
  @Get('/find-by-phone/:phone')
  findUserInfoByPhone(@Param('phone') phone: string) {
    return this.userService.findUserInfoByPhone(phone);
  }

  @HttpCode(HttpStatus.OK)
  @Post('/add-firebase-token')
  addFirebaseToken(
    @AuthUser() userId,
    @Body() firebaseTokenDto: FirebaseTokenDto,
  ) {
    return this.userService.addFirebaseToken(userId, firebaseTokenDto);
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('/remove-firebase-token')
  removeFirebaseToken(@Body() firebaseTokenDto: FirebaseTokenDto) {
    return this.userService.removeFirebaseToken(firebaseTokenDto);
  }

  @HttpCode(HttpStatus.OK)
  @Get('/get-profile/:user_id')
  getUserProfileByUserId(@Param('user_id') userId: string) {
    return this.userService.getUserProfiles(userId);
  }
}
