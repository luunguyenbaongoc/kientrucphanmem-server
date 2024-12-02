import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ChatBox, Group } from 'src/entities';
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
import { ChatGateway } from 'src/modules/socket/chat/chat.gateway';
import { CloudMessagingService } from 'src/modules/firebase/cloud-messaging/cloud-messaging.service';

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
    private chatGateway: ChatGateway,
    private cloudMessagingService: CloudMessagingService,
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
      newGroup.owner_id = userId;
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

      const ownerGroupChatBox = new ChatBox();
      ownerGroupChatBox.from_user = userId;
      ownerGroupChatBox.to_group = newGroup.id;
      ownerGroupChatBox.last_accessed_date = createdDate;
      ownerGroupChatBox.latest_updated_date = createdDate;
      ownerGroupChatBox.new_message = true;
      await queryRunner.manager.save(ownerGroupChatBox);

      if (user_ids) {
        for (let i = 0; i < user_ids.length; i++) {
          const uid = user_ids[i];
          if (userId === uid) {
            continue;
          }
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

          const groupChatBox = new ChatBox();
          groupChatBox.from_user = uid;
          groupChatBox.to_group = newGroup.id;
          groupChatBox.last_accessed_date = createdDate;
          groupChatBox.latest_updated_date = createdDate;
          groupChatBox.new_message = true;
          await queryRunner.manager.save(groupChatBox);
        }

        for (const id of user_ids) {
          this.chatGateway.sendCreatedMessage(userId, id, newGroup.id, true);
          const firebaseTokenList = await this.userService.getFirebaseTokenList(
            id,
          );
          if (firebaseTokenList.length > 0) {
            this.cloudMessagingService.sendMulticastMessage({
              content: 'Tin nhắn mới',
              title: 'Tin nhắn mới',
              tokens: firebaseTokenList,
              data: { payloadId: newGroup.id, isGroupChat: true.toString() },
            });
          }
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
      const { id, avatar, description, group_status_code, name } =
        updateGroupDto;
      await this.userService.findByIdAndCheckExist(userId);
      const group = await this.findByIdAndCheckExist(id);
      if (group_status_code) {
        const groupStatus =
          await this.groupStatusService.findByCodeAndCheckExist(
            group_status_code,
          );
        group.group_status_id = groupStatus.id;
      }

      group.name = name || group.name;
      group.avatar = avatar || group.avatar;
      group.latest_updated_by = userId;
      group.latest_updated_date = new Date();
      group.description = description || group.description;

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
    return group.owner_id === userId;
  }
}
