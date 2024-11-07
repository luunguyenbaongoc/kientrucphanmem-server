import { forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
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
    private friendService: FriendService,
    @Inject(forwardRef(() => GroupService))
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
      const createdDate = new Date();
      for (let i = 0; i < addMembersDto.user_ids.length; i++) {
        const id = addMembersDto.user_ids[i];
        await this.userService.findByIdAndCheckExist(id);
        const isFriend = await this.friendService.isFriend(uerId, id);
        if (!isFriend) {
          throw new AppError(
            HttpStatus.BAD_REQUEST,
            ErrorCode.BAD_REQUEST,
            `Người dùng id ${uerId} và id ${id} không phải là bạn bè`,
          );
        }

        const newMember = new GroupMembers();
        newMember.group_id = addMembersDto.group_id;
        newMember.created_by = uerId;
        newMember.user_id = addMembersDto.user_ids[i];
        newMember.created_date = createdDate;
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

  async findByUserId(userId: string): Promise<GroupMembers[]> {
    const groupMembers: GroupMembers[] = await this.groupMembersRepository.find({
      where: { user_id: userId },
    });
    return groupMembers;
  }
}
