import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class UpdateGroupDto {
  @ApiProperty()
  @IsString({ message: 'Không có id' })
  id: string;

  @ApiProperty()
  @IsString({ message: 'Không có tên nhóm' })
  name: string;

  @ApiProperty()
  @IsString({ message: 'Không có group status code' })
  group_status_code: string;
}
