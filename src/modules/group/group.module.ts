import { Module } from '@nestjs/common';
import { GroupController } from './group.controller';
import { GroupService } from './group.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from '../user/user.module';
import { Group } from 'src/entities';
import { GroupStatusModule } from '../group_status/group_status.module';
import { GroupStatus } from 'src/entities/group_status.entity';
import { GroupMembersModule } from '../group_members/group_members.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Group, GroupStatus]),
    GroupMembersModule,
    UserModule,
    GroupStatusModule,
  ],
  exports: [GroupService],
  controllers: [GroupController],
  providers: [GroupService],
})
export class GroupModule {}
