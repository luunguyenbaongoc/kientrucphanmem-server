import { IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AddProfileDto {
  @ApiProperty()
  @IsOptional()
  @IsString()
  fullname?: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  avatar?: string;
}
