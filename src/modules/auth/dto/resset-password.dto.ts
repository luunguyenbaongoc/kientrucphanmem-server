import { IsString } from 'class-validator';

export class ResetPasswordDto {
  @IsString({ message: 'Không có số điện thoại' })
  phone: string;

  @IsString({ message: 'Không có mật khẩu' })
  new_password: string;
}
