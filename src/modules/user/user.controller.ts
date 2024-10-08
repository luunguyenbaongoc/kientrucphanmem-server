import { 
  Controller, 
  Patch, 
  Post, 
  Body,
  Param,
  Req,
  HttpCode,
  UseGuards,
  HttpStatus
} from '@nestjs/common';
import { 
  ApiTags, 
  ApiBearerAuth, 
  ApiConsumes
} from '@nestjs/swagger';
import { UserService } from './user.service';
import { UpdateProfileDto } from './dto';
import { JwtAuthGuard } from '../auth/guards';
import { Request } from 'express';

@ApiTags('user')
@ApiBearerAuth()
@Controller('user')
export class UserController {
  constructor(private userService: UserService) {}

  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiConsumes('application/json', 'application/x-www-form-urlencoded')
  @Post('me/profiles/')
  createUserProfile(
    @Req() req: Request,
    @Body() updateProfileDto: UpdateProfileDto)
  {
    const userId = req.user['id'];
    return this.userService.createUserProfile(userId, updateProfileDto);
  }

  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiConsumes('application/json', 'application/x-www-form-urlencoded')
  @Patch('me/profiles/:profileId')
  updateUserProfile(
    @Req() req: Request,
    @Param('profileId') profileId: string,
    @Body() updateProfileDto: UpdateProfileDto)
  {
    const userId = req.user['id'];
    return this.userService.updateUserProfile(userId, profileId, updateProfileDto);
  }
}
