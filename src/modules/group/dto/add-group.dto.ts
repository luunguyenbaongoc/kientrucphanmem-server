import { IsString } from 'class-validator';

export class AddGroupDto {
  @IsString({ message: 'Không có tên nhóm' })
  name: string;

  @IsString({ message: 'Không có group status code' })
  group_status_code: string;
}
