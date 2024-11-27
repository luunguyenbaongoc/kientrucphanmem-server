import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty()
  @IsString({ message: 'Không có số điện thoại' })
  phone: string;

  @ApiProperty()
  @IsString({ message: 'Không có mật khẩu' })
  password: string;

  @ApiProperty()
  @IsString({ message: 'Không có họ tên' })
  fullname: string;
}
