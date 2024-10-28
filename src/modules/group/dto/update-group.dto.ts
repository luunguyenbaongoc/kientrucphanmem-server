import { IsString } from 'class-validator';

export class UpdateGroupDto {
  @IsString({ message: 'Không có id' })
  id: string;

  @IsString({ message: 'Không có tên nhóm' })
  name: string;

  @IsString({ message: 'Không có group status code' })
  group_status_code: string;
}
