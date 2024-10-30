import { IsString } from 'class-validator';

export class MakeRequestDto {
  @IsString({ message: 'Không có to_user_phone' })
  to_user_phone: string;
}
