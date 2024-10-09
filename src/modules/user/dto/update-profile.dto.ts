import { IsString, IsOptional, IsDate } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateProfileDto {
  @ApiProperty()
  @IsOptional()
  @IsString()
  fullname?: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  avatar?: string;
}
