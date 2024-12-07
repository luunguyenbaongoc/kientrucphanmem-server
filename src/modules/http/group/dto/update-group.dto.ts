import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class UpdateGroupDto {
  @ApiProperty()
  @IsString({ message: 'Không có id' })
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  avatar: string;

  @ApiProperty()
  group_status_code: string;

  @ApiProperty()
  description: string;
}
