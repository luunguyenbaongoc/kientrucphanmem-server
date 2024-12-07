import { ApiProperty } from '@nestjs/swagger';

export class GetChatBoxDetailDto {
  @ApiProperty()
  to_user: string;

  @ApiProperty()
  to_group: string;

  @ApiProperty()
  chat_box_id: string;
}
