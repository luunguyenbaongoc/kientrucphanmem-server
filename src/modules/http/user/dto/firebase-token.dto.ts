import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class FirebaseTokenDto {
  @ApiProperty()
  userId: string;

  @ApiProperty()
  @IsString({ message: 'Không có token' })
  token: string;
}
