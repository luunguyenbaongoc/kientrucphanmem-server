import { Module } from '@nestjs/common';
import { ChatLogContentTypeController } from './chat_log_content_type.controller';
import { ChatLogContentTypeService } from './chat_log_content_type.service';
import { ChatLogContentType } from 'src/entities';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([ChatLogContentType])],
  controllers: [ChatLogContentTypeController],
  providers: [ChatLogContentTypeService],
  exports: [ChatLogContentTypeService],
})
export class ChatLogContentTypeModule {}
