import {
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Body,
  Put,
  UseGuards,
  UploadedFile,
  UseInterceptors,
  Param,
  Delete,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { GroupService } from './group.service';
import { AuthUser } from 'src/decorators';
import { AddGroupDto, UpdateGroupDto } from './dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/guards';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { Group } from 'src/entities';

@ApiTags('Group')
@ApiBearerAuth()
@Controller('group')
export class GroupController {
  constructor(private groupService: GroupService) {}

  @HttpCode(HttpStatus.CREATED)
  @ApiConsumes('application/json')
  @Post('/')
  addGroup(@AuthUser() userId: string, @Body() addGroupDto: AddGroupDto) {
    return this.groupService.addGroup(userId, addGroupDto);
  }

  @HttpCode(HttpStatus.OK)
  @ApiConsumes('application/json')
  @Put('/')
  updateGroup(
    @AuthUser() userId: string,
    @Body() updateGroupDto: UpdateGroupDto,
  ) {
    return this.groupService.updateGroup(userId, updateGroupDto);
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
  @Post(':groupId/upload-image')
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
  async uploadGroupAvatar(
    @AuthUser() userId: string,
    @UploadedFile() file: Express.Multer.File,
    @Param('groupId') groupId: string,
  ): Promise<Group> {
    return this.groupService.updateGroup(userId, {
      id: groupId,
      avatar: file.path,
    } as UpdateGroupDto);
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard)
  @Delete('/:id')
  @ApiConsumes('application/json', 'application/x-www-form-urlencoded')
  deleteUserGroup(@AuthUser() userId: string, @Param('id') id: string) {
    return this.groupService.deleteGroupById(userId, id);
  }
}
