import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class FindByTextDto {
  @ApiProperty()
  @IsString({ message: 'Không có text (tên hoặc số điện thoại)' })
  text: string;
}
