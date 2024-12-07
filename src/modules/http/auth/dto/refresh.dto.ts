import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsString } from 'class-validator';

export class RefreshDto {
  @ApiProperty()
  @IsString({ message: 'Không có id' })
  id: string;

  @ApiProperty()
  @IsString({ message: 'Không có refresh token' })
  refresh_token: string;

  @ApiProperty()
  @IsBoolean()
  is_new_refresh_token: boolean;
}
