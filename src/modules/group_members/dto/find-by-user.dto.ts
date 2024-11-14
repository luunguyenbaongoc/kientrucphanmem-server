import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class FindByUserDto {
  @ApiProperty()
  @IsString({ message: 'Không có group_id' })
  searchText: string;
}
