import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class UpdateRequestDto {
  @ApiProperty()
  @IsString({ message: 'Không có id' })
  id: string;

  @ApiProperty()
  @IsString({ message: 'Không có status_code' })
  status_code: string;
}
