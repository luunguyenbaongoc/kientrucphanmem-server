import { IsString } from 'class-validator';

export class UpdateFriendDto {
  @IsString({ message: 'Không có id' })
  id: string;

  @IsString({ message: 'Không có id' })
  friend_status_code: string;
}
