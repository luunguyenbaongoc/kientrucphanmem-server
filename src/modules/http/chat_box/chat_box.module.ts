import { forwardRef, Module } from '@nestjs/common';
import { ChatBoxService } from './chat_box.service';
import { ChatBoxController } from './chat_box.controller';
import { ChatBox } from 'src/entities';
import { UserModule } from '../user/user.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GroupModule } from '../group/group.module';
import { GroupStatusModule } from '../group_status/group_status.module';

@Module({
  providers: [ChatBoxService],
  controllers: [ChatBoxController],
  imports: [
    TypeOrmModule.forFeature([ChatBox]),
    UserModule,
    GroupStatusModule,
    GroupModule,
  ],
  exports: [ChatBoxService],
})
export class ChatBoxModule {}
