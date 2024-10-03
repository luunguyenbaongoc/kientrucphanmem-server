import { IsBoolean, IsString } from 'class-validator';

export class RefreshDto {
  @IsString({ message: 'Không có id' })
  id: string;

  @IsString({ message: 'Không có refresh token' })
  refreshToken: string;

  @IsBoolean()
  isNewRefreshToken: boolean;
}
