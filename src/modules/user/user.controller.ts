import {
  Controller,
  Patch,
  Post,
  Get,
  Body,
  Param,
  Req,
  HttpCode,
  UseGuards,
  HttpStatus,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { UserService } from './user.service';
import { UpdateProfileDto } from './dto';
import { JwtAuthGuard } from '../auth/guards';
import { Request } from 'express';
import { diskStorage } from 'multer';
import { extname } from 'path';

@ApiTags('user')
@ApiBearerAuth()
@Controller('user')
export class UserController {
  constructor(private userService: UserService) {}

  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiConsumes('application/json', 'application/x-www-form-urlencoded')
  @Get('me/profiles/')
  getUserProfiles(@Req() req: Request) {
    const userId = req.user['id'];
    return this.userService.getUserProfiles(userId);
  }

  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard)
  @ApiConsumes('application/json', 'application/x-www-form-urlencoded')
  @Post('me/profiles/')
  createUserProfile(
    @Req() req: Request,
    @Body() updateProfileDto: UpdateProfileDto,
  ) {
    const userId = req.user['id'];
    return this.userService.createUserProfile(userId, updateProfileDto);
  }

  @HttpCode(HttpStatus.OK)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, callback) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          callback(null, `${uniqueSuffix}${extname(file.originalname)}`);
        },
      }),
      fileFilter: (req, file, callback) => {
        const isImage = ['image/png', 'image/jpeg', 'image/jpg'].includes(file.mimetype);
        if (!isImage) {
          return callback(new Error(`Không hỗ trợ file ${extname(file.originalname)}`), false);
        }
        callback(null, true);
      }
    }),
  )
  @Post('me/profiles/:profileId/upload-image')
  @UseGuards(JwtAuthGuard)
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  async uploadProfileImage(
    @UploadedFile() file: Express.Multer.File,
    @Param('profileId') profileId: string,
  ): Promise<string> {
    return this.userService.uploadProfilePicture(file.path, profileId);
  }

  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiConsumes('application/json', 'application/x-www-form-urlencoded')
  @Patch('me/profiles/:profileId')
  updateUserProfile(
    @Param('profileId') profileId: string,
    @Body() updateProfileDto: UpdateProfileDto,
  ) {
    return this.userService.updateUserProfile(profileId, updateProfileDto);
  }
}
