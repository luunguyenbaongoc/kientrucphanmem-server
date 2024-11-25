import { IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateProfileDto {
  @ApiProperty()
  @IsString({ message: 'Không có profileId' })
  profileId: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  fullname?: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  avatar?: string;
}
