import { IsString } from 'class-validator';

export class RevokeRefreshDto {
  @IsString({ message: 'Không có id' })
  id: string;

  @IsString({ message: 'Không có refresh token' })
  refresh_token: string;
}
