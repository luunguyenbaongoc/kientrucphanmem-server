import {
  forwardRef,
  HttpStatus,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { GroupMembers } from 'src/entities/group_members.entity';
import { DataSource, ILike, In, Repository } from 'typeorm';
import { UserService } from '../user/user.service';
import { GroupStatusService } from '../group_status/group_status.service';
import { GroupService } from '../group/group.service';
import { AddMembersDto } from './dto/add-members.dto';
import { FriendService } from '../friend/friend.service';
import { AppError } from 'src/utils/AppError';
import { ErrorCode } from 'src/utils/error-code';
import { FindByUserDto } from './dto';
import { GroupStatusCode } from 'src/utils/enums';
import { RemoveMembersDto } from './dto/remove-members.dto';
import { FindByGroupResult, FindByUserResult } from './types';
import { ChatBox } from 'src/entities';
import { ChatGateway } from 'src/modules/socket/chat/chat.gateway';
import { CloudMessagingService } from 'src/modules/firebase/cloud-messaging/cloud-messaging.service';

@Injectable()
export class GroupMembersService {
  constructor(
    @InjectRepository(GroupMembers)
    private groupMembersRepository: Repository<GroupMembers>,
    @InjectRepository(ChatBox)
    private chatboxRepository: Repository<ChatBox>,
    private userService: UserService,
    private friendService: FriendService,
    @Inject(forwardRef(() => GroupService))
    private groupService: GroupService,
    private dataSource: DataSource,
    private groupStatusService: GroupStatusService,
    private chatGateway: ChatGateway,
    private cloudMessagingService: CloudMessagingService,
  ) {}

  private readonly logger = new Logger(GroupMembersService.name);

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
        newMember.user_id = id;
        newMember.created_date = createdDate;
        await queryRunner.manager.save(newMember);

        const chatbox = await this.chatboxRepository.findOneBy({
          from_user: id,
          to_group: addMembersDto.group_id,
        });
        if (chatbox) {
          chatbox.deleted = false;
          await queryRunner.manager.save(chatbox);
        } else {
          const groupChatBox = new ChatBox();
          groupChatBox.from_user = id;
          groupChatBox.to_group = addMembersDto.group_id;
          groupChatBox.last_accessed_date = createdDate;
          groupChatBox.latest_updated_date = createdDate;
          groupChatBox.new_message = true;
          groupChatBox.created_date = new Date();
          groupChatBox.deleted = false;
          groupChatBox.muted = false;
          await queryRunner.manager.save(groupChatBox);
        }
        members.push(newMember);
      }
      await queryRunner.commitTransaction();

      for (const id of addMembersDto.user_ids) {
        this.chatGateway.sendCreatedMessage(
          uerId,
          id,
          addMembersDto.group_id,
          true,
        );
        const firebaseTokenList = await this.userService.getFirebaseTokenList(
          id,
        );
        if (firebaseTokenList.length > 0) {
          this.cloudMessagingService.sendMulticastMessage({
            content: 'Tin nhắn mới',
            title: 'Tin nhắn mới',
            tokens: firebaseTokenList,
            data: {
              payloadId: addMembersDto.group_id,
              isGroupChat: true.toString(),
            },
          });
        }
      }

      return members;
    } catch (ex) {
      Logger.error(ex);
      await queryRunner.rollbackTransaction();
      throw ex;
    } finally {
      await queryRunner.release();
    }
  }

  async removeMembers(
    userId: string,
    removeMembersDto: RemoveMembersDto,
  ): Promise<boolean> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const { group_id, user_ids } = removeMembersDto;

      await this.userService.findByIdAndCheckExist(userId);
      const isGroupAdmin = await this.groupService.checkUserIsGroupAdmin(
        userId,
        group_id,
      );
      if (!isGroupAdmin) {
        throw new AppError(
          HttpStatus.BAD_REQUEST,
          ErrorCode.BAD_REQUEST,
          `Bạn không thể xóa thành viên vì không phải là chủ nhóm chat`,
        );
      }
      if (removeMembersDto.user_ids.indexOf(userId) !== -1) {
        // Can't delete admin user
        throw new AppError(
          HttpStatus.BAD_REQUEST,
          ErrorCode.BAD_REQUEST,
          `Không thể xóa chủ nhóm chat`,
        );
      }

      // await this.groupMembersRepository.delete({
      //   group_id: removeMembersDto.group_id,
      //   user_id: In(removeMembersDto.user_ids.filter((id) => id !== userId)),
      // });

      for (const id of user_ids) {
        await this.userService.findByIdAndCheckExist(id);
        const groupMember = await this.groupMembersRepository.findOneBy({
          group_id: group_id,
          user_id: id,
        });
        if (groupMember) {
          await queryRunner.manager.delete(GroupMembers, groupMember);
        }
        const chatbox = await this.chatboxRepository.findOneBy({
          from_user: id,
          to_group: group_id,
        });
        if (chatbox) {
          chatbox.deleted = true;
          await queryRunner.manager.save(chatbox);
        }
      }
      await queryRunner.commitTransaction();

      for (const id of user_ids) {
        this.chatGateway.sendCreatedMessage(userId, id, group_id, true);
        const firebaseTokenList = await this.userService.getFirebaseTokenList(
          id,
        );
        if (firebaseTokenList.length > 0) {
          this.cloudMessagingService.sendMulticastMessage({
            content: 'Tin nhắn mới',
            title: 'Tin nhắn mới',
            tokens: firebaseTokenList,
            data: {
              payloadId: group_id,
              isGroupChat: true.toString(),
            },
          });
        }
      }

      return true;
    } catch (ex) {
      Logger.error(ex);
      await queryRunner.rollbackTransaction();
      throw ex;
    } finally {
      await queryRunner.release();
    }
  }

  async findByUserId(
    userId: string,
    findByUserDto: FindByUserDto,
  ): Promise<FindByUserResult | undefined> {
    try {
      const searchText = findByUserDto.searchText || '';
      const groupStatus = await this.groupStatusService.findByCodeAndCheckExist(
        GroupStatusCode.ACTIVE,
      );
      const groupMembers: GroupMembers[] =
        await this.groupMembersRepository.find({
          where: {
            user_id: userId,
            group: {
              group_status_id: groupStatus.id,
              name: ILike(`%${searchText}%`),
            },
          },
          relations: ['group', 'group.group_members'],
          select: {
            user_id: true,
            group_id: true,
            group: {
              id: true,
              name: true,
              avatar: true,
              owner_id: true,
              group_members: { user_id: true, group_id: true },
            },
          },
        });

      if (!groupMembers) {
        return null;
      }
      return {
        groups: groupMembers,
        count: groupMembers.length,
      };
    } catch (ex) {
      Logger.error(ex);
      throw ex;
    }
  }

  async findByGroupId(groupId: string): Promise<FindByGroupResult | undefined> {
    try {
      const groupMembers: GroupMembers[] =
        await this.groupMembersRepository.find({
          where: { group_id: groupId },
          relations: ['user.profile'],
          select: {
            user_id: true,
            group_id: true,
            user: {
              id: true,
              profile: {
                id: true,
                fullname: true,
                avatar: true,
              },
            },
          },
        });

      if (!groupMembers) {
        return null;
      }
      return {
        users: groupMembers,
        count: groupMembers.length,
      };
    } catch (ex) {
      Logger.error(ex);
      throw ex;
    }
  }

  async leaveGroup(userId: string, groupId: string): Promise<boolean> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      await this.userService.findByIdAndCheckExist(userId);
      const group = await this.groupService.findByIdAndCheckExist(groupId);
      const groupMember = await this.groupMembersRepository.findOneBy({
        user_id: userId,
        group_id: groupId,
      });
      if (!groupMember) {
        throw new AppError(
          HttpStatus.BAD_REQUEST,
          ErrorCode.BAD_REQUEST,
          `Dữ liệu sai, vui lòng thử lại`,
        );
      }
      const isOwner = await this.groupService.checkUserIsGroupAdmin(
        userId,
        groupId,
      );
      if (isOwner) {
        const groupMembers = await this.findByGroupId(groupId);
        if (groupMembers.count > 1) {
          for (let i = 0; i < groupMembers.count; i++) {
            const uid = groupMembers.users[i].user_id;
            if (userId !== uid) {
              group.owner_id = uid;
              break;
            }
          }
        } else {
          const groupStatus =
            await this.groupStatusService.findByCodeAndCheckExist(
              GroupStatusCode.INACTIVE,
            );
          group.group_status_id = groupStatus.id;
        }
        await queryRunner.manager.save(group);
      }
      await queryRunner.manager.delete(GroupMembers, groupMember);

      const chatbox = await this.chatboxRepository.findOneBy({
        from_user: userId,
        to_group: groupId,
      });
      if (chatbox) {
        chatbox.deleted = true;
        await queryRunner.manager.save(chatbox);
      }
      await queryRunner.commitTransaction();

      const remainingMembers = await this.findByGroupId(groupId);
      for (const member of remainingMembers.users) {
        if (member.user_id !== userId) {
          this.chatGateway.sendCreatedMessage(
            userId,
            member.user_id,
            groupId,
            true,
          );
          const firebaseTokenList = await this.userService.getFirebaseTokenList(
            member.user_id,
          );
          if (firebaseTokenList.length > 0) {
            this.cloudMessagingService.sendMulticastMessage({
              content: 'Tin nhắn mới',
              title: 'Tin nhắn mới',
              tokens: firebaseTokenList,
              data: {
                payloadId: groupId,
                isGroupChat: true.toString(),
              },
            });
          }
        }
      }
      return true;
    } catch (ex) {
      Logger.error(ex);
      await queryRunner.rollbackTransaction();
      throw ex;
    } finally {
      await queryRunner.release();
    }
  }
}
