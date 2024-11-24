import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ChatBox } from 'src/entities';
import { UserService } from '../user/user.service';
import { Repository } from 'typeorm';
import { ListByUserResult } from './types/list-by-user';
import { GroupService } from '../group/group.service';
import { AppError } from 'src/utils/AppError';
import { ErrorCode } from 'src/utils/error-code';

@Injectable()
export class ChatBoxService {
  constructor(
    @InjectRepository(ChatBox)
    private chatboxRepository: Repository<ChatBox>,
    private userService: UserService,
    private groupService: GroupService,
  ) {}

  async listByUserId(userId: string): Promise<ListByUserResult | undefined> {
    try {
      await this.userService.findByIdAndCheckExist(userId);

      const chatboxList = await this.chatboxRepository.find({
        where: { from_user: userId, deleted: false },
        relations: [
          'to_user_profile',
          'to_user_profile.profile',
          'to_group_profile',
        ],
        select: {
          id: true,
          last_accessed_date: true,
          to_user_profile: {
            id: true,
            profile: { id: true, avatar: true, fullname: true },
          },
          to_group_profile: {
            avatar: true,
            name: true,
            description: true,
            owner_id: true,
          },
        },
      });

      return {
        data: [...chatboxList],
        count: chatboxList.length,
      };
    } catch (ex) {
      Logger.error(ex);
      throw ex;
    }
  }

  async create(
    from_user: string,
    to_user?: string,
    to_group?: string,
  ): Promise<ChatBox | undefined> {
    try {
      await this.userService.findByIdAndCheckExist(from_user);
      if (to_user) {
        await this.userService.findByIdAndCheckExist(to_user);
      }
      if (to_group) {
        await this.groupService.findByIdAndCheckExist(to_group);
      }

      const newDate = new Date();
      const newChatBox = new ChatBox();
      newChatBox.from_user = from_user;
      newChatBox.to_user = to_user;
      newChatBox.to_group = to_group;
      newChatBox.last_accessed_date = newDate;
      newChatBox.latest_updated_date = newDate;
      await this.chatboxRepository.insert(newChatBox);

      return newChatBox;
    } catch (ex) {
      Logger.error(ex);
      throw ex;
    }
  }

  async findOneBy(
    from_user: string,
    to_user?: string,
    to_group?: string,
  ): Promise<ChatBox | undefined> {
    try {
      await this.userService.findByIdAndCheckExist(from_user);
      let whereConditions;
      let relations;
      if (to_user) {
        await this.userService.findByIdAndCheckExist(to_user);
        whereConditions = {
          from_user,
          to_user,
          deleted: false,
        };
        relations = ['to_user_profile', 'to_user_profile.profile'];
      }
      if (to_group) {
        await this.groupService.findByIdAndCheckExist(to_group);
        whereConditions = {
          from_user,
          to_group,
          deleted: false,
        };
        relations = ['to_group_profile'];
      }

      const chatbox = await this.chatboxRepository.findOne({
        where: { ...whereConditions },
        relations: [...relations],
        select: {
          id: true,
          last_accessed_date: true,
          to_user_profile: {
            id: true,
            profile: { id: true, avatar: true, fullname: true },
          },
          to_group_profile: {
            avatar: true,
            name: true,
            description: true,
            owner_id: true,
          },
        },
      });

      return chatbox;
    } catch (ex) {
      Logger.error(ex);
      throw ex;
    }
  }

  async findById(id: string): Promise<ChatBox | undefined> {
    return await this.chatboxRepository.findOneBy({ id });
  }

  async findByIdAndCheckExist(id: string): Promise<ChatBox | undefined> {
    const chatboxById = await this.findById(id);
    if (!chatboxById) {
      throw new AppError(
        HttpStatus.BAD_REQUEST,
        ErrorCode.BAD_REQUEST,
        `Chatbox id ${id} không tồn tại`,
      );
    }
    return chatboxById;
  }
}
