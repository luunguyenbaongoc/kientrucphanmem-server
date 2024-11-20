import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class MakeRequestDto {
  @ApiProperty()
  @IsString({ message: 'Không có to_user_phone' })
  to_user_phone: string;
}
