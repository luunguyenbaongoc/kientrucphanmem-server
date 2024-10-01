import { IsString } from 'class-validator';

export class RegisterDto {
  @IsString({ message: 'Không có số điện thoại' })
  phone: string;

  @IsString({ message: 'Không có mật khẩu' })
  password: string;

  @IsString({ message: 'Không có họ tên' })
  fullname: string;
}
