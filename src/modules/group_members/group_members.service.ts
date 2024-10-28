import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { GroupMembers } from 'src/entities/group_member.entity';
import { DataSource, Repository } from 'typeorm';
import { UserService } from '../user/user.service';
import { GroupStatusService } from '../group_status/group_status.service';
import { GroupService } from '../group/group.service';
import { AddMembersDto } from './dto/add-members.dto';

@Injectable()
export class GroupMembersService {
  constructor(
    @InjectRepository(GroupMembers)
    private groupMembersRepository: Repository<GroupMembers>,
    private userService: UserService,
    private groupStatusService: GroupStatusService,
    private groupService: GroupService,
    private dataSource: DataSource,
  ) {}

  async addMembers(
    uerId: string,
    addMembersDto: AddMembersDto,
  ): Promise<GroupMembers[] | undefined> {
    const queryRunner = this.dataSource.createQueryRunner();
    try {
      await this.userService.findByIdAndCheckExist(uerId);
      await this.groupService.findByIdAndCheckExist(addMembersDto.group_id);

      await queryRunner.connect();
      await queryRunner.startTransaction();

      const members: GroupMembers[] = [];
      for (let i = 0; i < addMembersDto.user_ids.length; i++) {
        await this.userService.findByIdAndCheckExist(addMembersDto.user_ids[i]);

        const newMember = new GroupMembers();
        newMember.group_id = addMembersDto.group_id;
        newMember.created_by = uerId;
        newMember.user_id = addMembersDto.user_ids[i];

        await queryRunner.manager.save(newMember);
        members.push(newMember);
      }

      await queryRunner.commitTransaction();

      return members;
    } catch (ex) {
      Logger.error(ex);
      await queryRunner.rollbackTransaction();
      throw ex;
    } finally {
      await queryRunner.release();
    }
  }
}
