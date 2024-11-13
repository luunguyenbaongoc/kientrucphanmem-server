import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class FindByTextDto {
  @ApiProperty()
  @IsString({ message: 'Không có text' })
  text: string;
}
