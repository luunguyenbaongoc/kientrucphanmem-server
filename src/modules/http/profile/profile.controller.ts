import {
  Controller,
  HttpCode,
  HttpStatus,
  UseInterceptors,
  Post,
  Param,
  Body,
  UseGuards,
  UploadedFile,
  Put,
} from '@nestjs/common';
import { ApiConsumes, ApiBody, ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { UpdateProfileDto } from './dto';
import { JwtAuthGuard } from '../auth/guards';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { ProfileService } from './profile.service';
import { Profile } from 'src/entities';

@ApiTags('Profile')
@ApiBearerAuth()
@Controller('profile')
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

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
        const isImage = ['image/png', 'image/jpeg', 'image/jpg'].includes(
          file.mimetype,
        );
        if (!isImage) {
          return callback(
            new Error(`Không hỗ trợ file ${extname(file.originalname)}`),
            false,
          );
        }
        callback(null, true);
      },
    }),
  )
  @Post('/:profileId/upload-image')
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
  ): Promise<Profile> {
    return this.profileService.updateProfile({
      profileId,
      avatar: file.path,
    } as UpdateProfileDto);
  }

  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiConsumes('application/json')
  @Put('/')
  updateUserProfile(@Body() updateProfileDto: UpdateProfileDto) {
    return this.profileService.updateProfile(updateProfileDto);
  }
}
