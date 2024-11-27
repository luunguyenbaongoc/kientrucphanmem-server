import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class ResetPasswordDto {
  @ApiProperty()
  @IsString({ message: 'Không có số điện thoại' })
  phone: string;

  @ApiProperty()
  @IsString({ message: 'Không có mật khẩu' })
  new_password: string;
}
