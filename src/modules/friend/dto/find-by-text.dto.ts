import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class FindByTextdDto {
  @ApiProperty()
  @IsString({ message: 'Không có text' })
  text: string;
}
