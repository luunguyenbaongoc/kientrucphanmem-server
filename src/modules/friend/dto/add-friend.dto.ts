import { IsString } from 'class-validator';

export class AddFriendDto {
  @IsString({ message: 'Không có user_id' })
  user_id: string;
}
