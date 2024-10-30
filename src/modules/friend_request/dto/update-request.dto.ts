import { IsString } from 'class-validator';

export class UpdateRequestDto {
  @IsString({ message: 'Không có id' })
  id: string;

  @IsString({ message: 'Không có status_code' })
  status_code: string;
}
