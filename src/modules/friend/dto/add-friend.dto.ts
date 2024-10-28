import { IsString } from 'class-validator';

export class AddFriendDto {
  @IsString({ message: 'Không có to_user_phone' })
  to_user_phone: string;
}
