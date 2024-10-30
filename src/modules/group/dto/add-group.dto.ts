import { IsString } from 'class-validator';

export class AddGroupDto {
  @IsString({ message: 'Không có tên nhóm' })
  name: string;
}
