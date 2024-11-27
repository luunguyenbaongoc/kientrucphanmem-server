import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LogInDto {
  @ApiProperty()
  @IsString({ message: 'Không có số điện thoại' })
  phone: string;

  @ApiProperty()
  @IsString({ message: 'Không có mật khẩu' })
  password: string;
}
