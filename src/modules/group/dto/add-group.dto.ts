import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class AddGroupDto {
  @ApiProperty()
  @IsString({ message: 'Không có tên nhóm' })
  name: string;

  @ApiProperty()
  description: string;
}
