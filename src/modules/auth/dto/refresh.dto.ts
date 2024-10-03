import { IsBoolean, IsString } from 'class-validator';

export class RefreshDto {
  @IsString({ message: 'Không có id' })
  id: string;

  @IsString({ message: 'Không có refresh token' })
  refresh_token: string;

  @IsBoolean()
  is_new_refresh_token: boolean;
}
