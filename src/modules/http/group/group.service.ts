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
import { FriendService } from '../friend/friend.service';

@Injectable()
export class GroupService {
  constructor(
    @InjectRepository(Group)
    private groupRepository: Repository<Group>,
    private groupMemberService: GroupMembersService,
    private userService: UserService,
    private groupStatusService: GroupStatusService,
    private dataSource: DataSource,
    private friendService: FriendService,
  ) {}

  async findByName(name: string): Promise<Group | undefined> {
    return await this.groupRepository.findOneBy({ name });
  }

  async addGroup(
    userId: string,
    addGroupDto: AddGroupDto,
  ): Promise<Group | undefined> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const { user_ids, name, description } = addGroupDto;
      await this.userService.findByIdAndCheckExist(userId);

      const groupStatus = await this.groupStatusService.findByCodeAndCheckExist(
        GroupStatusCode.ACTIVE,
      );

      const newGroup = new Group();
      newGroup.name = name;
      newGroup.description = description;
      newGroup.created_by = userId;
      newGroup.group_status_id = groupStatus.id;
      newGroup.code = genRandomCode();
      newGroup.created_date = new Date();
      newGroup.latest_updated_date = new Date();
      newGroup.latest_updated_by = userId;
      newGroup.avatar = fs.readFileSync(
        path.join(__dirname, '../../../images/default-avatar.jpg'),
        'base64',
      );

      await queryRunner.manager.insert(Group, newGroup);
      // newGroup = await this.findByCode(newGroup.code);

      //add user created group to group member
      const createdDate = new Date();
      const newMember = new GroupMembers();
      newMember.group_id = newGroup.id;
      newMember.created_by = userId;
      newMember.user_id = userId;
      newMember.created_date = createdDate;
      await queryRunner.manager.save(newMember);

      if (user_ids) {
        for (let i = 0; i < user_ids.length; i++) {
          const uid = user_ids[i];
          await this.userService.findByIdAndCheckExist(uid);
          const isFriend = await this.friendService.isFriend(userId, uid);
          if (!isFriend) {
            throw new AppError(
              HttpStatus.BAD_REQUEST,
              ErrorCode.BAD_REQUEST,
              `Người dùng id ${userId} và id ${uid} không phải là bạn bè`,
            );
          }
          const newMember = new GroupMembers();
          newMember.user_id = user_ids[i];
          newMember.group_id = newGroup.id;
          newMember.created_by = userId;
          newMember.created_date = createdDate;
          await queryRunner.manager.save(newMember);
        }
      }

      await queryRunner.commitTransaction();
      return newGroup;
    } catch (ex) {
      Logger.error(ex);
      await queryRunner.rollbackTransaction();
      throw ex;
    } finally {
      await queryRunner.release();
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

      group.name = updateGroupDto.name || group.name;
      group.group_status_id = groupStatus.id;
      group.avatar = updateGroupDto.avatar || group.avatar;
      group.latest_updated_by = userId;
      group.latest_updated_date = new Date();
      group.description = updateGroupDto.description || group.description;

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

  async delete(userId: string, groupId: string): Promise<Group | undefined> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const group = await this.findByIdAndCheckExist(groupId);
      const isOnwer = await this.checkUserIsGroupAdmin(userId, groupId);
      if (!isOnwer) {
        throw new AppError(
          HttpStatus.BAD_REQUEST,
          ErrorCode.BAD_REQUEST,
          `Bạn không có quyền xóa group ${groupId}`,
        );
      }
      const groupStatus = await this.groupStatusService.findByCodeAndCheckExist(
        GroupStatusCode.INACTIVE,
      );

      group.group_status_id = groupStatus.id;
      group.latest_updated_by = userId;
      group.latest_updated_date = new Date();
      await queryRunner.manager.save(group);

      const members = await this.groupMemberService.findByGroupId(group.id);
      for (let i = 0; i < members.count; i++) {
        const { user_id, group_id } = members.users[i];
        await queryRunner.manager.delete(GroupMembers, { user_id, group_id });
      }

      await queryRunner.commitTransaction();
      return group;
    } catch (ex) {
      Logger.error(ex);
      await queryRunner.rollbackTransaction();
      throw ex;
    } finally {
      await queryRunner.release();
    }
  }

  async checkUserIsGroupAdmin(
    userId: string,
    groupId: string,
  ): Promise<boolean> {
    const group = await this.findByIdAndCheckExist(groupId);
    return group.created_by === userId;
  }
}
