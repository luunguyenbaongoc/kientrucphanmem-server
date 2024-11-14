import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Group } from 'src/entities';
import { DataSource, Repository } from 'typeorm';
import { UserService } from '../user/user.service';
import { AppError } from 'src/utils/AppError';
import { ErrorCode } from 'src/utils/error-code';
import { AddGroupDto, UpdateGroupDto } from './dto';
import { GroupStatusService } from '../group_status/group_status.service';
import { GroupStatusCode } from 'src/utils/enums';
import { genRandomCode } from 'src/helpers';
import { GroupMembers } from 'src/entities/group_members.entity';
import { GroupMembersService } from '../group_members/group_members.service';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class GroupService {
  constructor(
    @InjectRepository(Group)
    private groupRepository: Repository<Group>,
    private groupMemberService: GroupMembersService,
    private userService: UserService,
    private groupStatusService: GroupStatusService,
    private dataSource: DataSource,
  ) {}

  async findByName(name: string): Promise<Group | undefined> {
    return await this.groupRepository.findOneBy({ name });
  }

  async addGroup(
    userId: string,
    addGroupDto: AddGroupDto,
  ): Promise<Group | undefined> {
    try {
      await this.userService.findByIdAndCheckExist(userId);

      const groupStatus = await this.groupStatusService.findByCodeAndCheckExist(
        GroupStatusCode.ACTIVE,
      );

      const newGroup = new Group();
      newGroup.name = addGroupDto.name;
      newGroup.created_by = userId;
      newGroup.group_status_id = groupStatus.id;
      newGroup.code = genRandomCode();
      newGroup.created_date = new Date();
      newGroup.latest_updated_date = new Date();
      newGroup.latest_updated_by = userId;
      newGroup.avatar = fs.readFileSync(
        path.join(__dirname, '../../images/default-avatar.jpg'),
        'base64',
      );

      await this.groupRepository.insert(newGroup);
      const createdGroup = await this.findByCode(newGroup.code);
      const queryRunner = this.dataSource.createQueryRunner();
      try {
        await queryRunner.connect();
        await queryRunner.startTransaction();

        const createdDate = new Date();
        const newMember = new GroupMembers();
        newMember.group_id = createdGroup.id;
        newMember.created_by = userId;
        newMember.user_id = userId;
        newMember.created_date = createdDate;
        await queryRunner.manager.save(newMember);

        await queryRunner.commitTransaction();
      } catch (ex) {
        Logger.error(ex);
        await queryRunner.rollbackTransaction();
        throw ex;
      } finally {
        await queryRunner.release();
      }
      return createdGroup;
    } catch (ex) {
      Logger.error(ex);
      throw ex;
    }
  }

  async updateGroup(
    userId: string,
    updateGroupDto: UpdateGroupDto,
  ): Promise<Group | undefined> {
    try {
      await this.userService.findByIdAndCheckExist(userId);
      const group = await this.findByIdAndCheckExist(updateGroupDto.id);
      const groupStatus = await this.groupStatusService.findByCodeAndCheckExist(
        updateGroupDto.group_status_code,
      );

      group.name = updateGroupDto.name;
      group.group_status_id = groupStatus.id;
      group.avatar = updateGroupDto.avatar;
      group.latest_updated_by = userId;
      group.latest_updated_date = new Date();

      await this.groupRepository.save(group);

      return group;
    } catch (ex) {
      Logger.error(ex);
      throw ex;
    }
  }

  async findById(id: string): Promise<Group | undefined> {
    return await this.groupRepository.findOneBy({ id });
  }

  async findByIdAndCheckExist(id: string): Promise<Group | undefined> {
    try {
      const group = await this.findById(id);
      if (!group) {
        throw new AppError(
          HttpStatus.BAD_REQUEST,
          ErrorCode.BAD_REQUEST,
          `Group id ${id} không tồn tại`,
        );
      }
      return group;
    } catch (ex) {
      Logger.error(ex);
      throw ex;
    }
  }

  async findByCode(code: string): Promise<Group | undefined> {
    return await this.groupRepository.findOneBy({ code });
  }

  async deleteGroupById(groupId: string): Promise<void> {
    const group = await this.findById(groupId);
    if (!group) {
      throw new Error('Group not found');
    }

    await this.groupRepository.delete(groupId);
  }
}
