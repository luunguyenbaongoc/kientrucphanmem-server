import { forwardRef, Module } from '@nestjs/common';
import { GroupMembersController } from './group_members.controller';
import { GroupMembersService } from './group_members.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Group } from 'src/entities';
import { UserModule } from '../user/user.module';
import { GroupStatusModule } from '../group_status/group_status.module';
import { GroupModule } from '../group/group.module';
import { GroupStatus } from 'src/entities/group_status.entity';
import { GroupMembers } from 'src/entities/group_member.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([GroupMembers, Group, GroupStatus]),
    UserModule,
    GroupStatusModule,
    forwardRef(() => GroupModule)
  ],
  controllers: [GroupMembersController],
  providers: [GroupMembersService],
  exports: [GroupMembersService],
})
export class GroupMembersModule {}
