import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class RevokeRefreshDto {
  @ApiProperty()
  @IsString({ message: 'Không có id' })
  id: string;

  @ApiProperty()
  @IsString({ message: 'Không có refresh token' })
  refresh_token: string;
}
