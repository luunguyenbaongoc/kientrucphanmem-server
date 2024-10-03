import { IsString } from 'class-validator';

export class LogInDto {
  @IsString({ message: 'Không có số điện thoại' })
  phone: string;

  @IsString({ message: 'Không có mật khẩu' })
  password: string;
}
