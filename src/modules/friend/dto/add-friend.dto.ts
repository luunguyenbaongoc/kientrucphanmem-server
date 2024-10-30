import { IsString } from 'class-validator';

export class AddFriendDto {
  @IsString({ message: 'Không có from_user' })
  from_user: string;

  @IsString({ message: 'Không có from_user' })
  to_user: string;
}
