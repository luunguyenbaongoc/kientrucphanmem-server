import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class UpdateGroupDto {
  @ApiProperty()
  @IsString({ message: 'Không có tên nhóm' })
  name: string;

  @ApiProperty()
  @IsString({ message: 'Không có avatar' })
  avatar: string;

  @ApiProperty()
  @IsString({ message: 'Không có group status code' })
  group_status_code: string;

  @ApiProperty()
  @IsString({ message: 'Không có mô tả' })
  description: string;
}
