import { IsArray, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AddMembersDto {
  @ApiProperty()
  @IsString({ message: 'Không có group_id' })
  group_id: string;

  @ApiProperty()
  @IsArray({ message: 'Không có user_ids' })
  user_ids: string[];
}
