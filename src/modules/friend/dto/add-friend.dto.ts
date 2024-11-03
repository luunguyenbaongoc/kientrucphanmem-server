import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class AddFriendDto {
  @ApiProperty()
  @IsString({ message: 'Không có from_user' })
  from_user: string;

  @ApiProperty()
  @IsString({ message: 'Không có from_user' })
  to_user: string;
}
