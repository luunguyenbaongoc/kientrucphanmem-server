import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsDate, IsDateString, IsString } from 'class-validator';
import { Platform } from 'src/utils/enums';

export class InsertDto {
  @ApiProperty()
  @IsDateString()
  created_date: Date;

  @ApiProperty()
  @IsString({ message: 'Không có content' })
  content: string;

  @ApiProperty()
  @IsString({ message: 'Không có content_type_code' })
  content_type_code: string;

  @ApiProperty()
  @IsBoolean({ message: 'Không có is_group_chat' })
  is_group_chat: boolean;

  @ApiProperty()
  @IsString({ message: 'Không có to_id' })
  to_id: string;

  @ApiProperty()
  platform: Platform;
}
