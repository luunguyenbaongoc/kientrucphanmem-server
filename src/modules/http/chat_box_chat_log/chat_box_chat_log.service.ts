import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ChatBoxChatLog } from 'src/entities';
import { Repository } from 'typeorm';
import { UserService } from '../user/user.service';
import { GroupService } from '../group/group.service';
import { GetChatBoxDetailDto } from './dto';
import { ChatBoxService } from '../chat_box/chat_box.service';
import { GroupStatusCode } from 'src/utils/enums';
import { GroupStatusService } from '../group_status/group_status.service';

@Injectable()
export class ChatBoxChatLogService {
  constructor(
    @InjectRepository(ChatBoxChatLog)
    private chatboxChatLogRepository: Repository<ChatBoxChatLog>,
    private userService: UserService,
    private groupService: GroupService,
    private chatboxService: ChatBoxService,
    private groupStatusService: GroupStatusService,
  ) {}

  async getChatBoxDetailBy(
    from_user: string,
    getChatBoxDetailDto: GetChatBoxDetailDto,
  ): Promise<ChatBoxChatLog[] | undefined> {
    try {
      await this.userService.findByIdAndCheckExist(from_user);
      const { chat_box_id, to_group, to_user } = getChatBoxDetailDto;
      let chatboxId: string;
      if (chat_box_id) {
        await this.chatboxService.findByIdAndCheckExist(chat_box_id);
        chatboxId = chat_box_id;
      } else {
        if (to_group) {
          await this.groupService.findByIdAndCheckExist(to_group);
          const chatbox = await this.chatboxService.findOneBy(
            from_user,
            null,
            to_group,
          );
          if (chatbox) {
            chatboxId = chatbox.id;
          }
        }
        if (to_user) {
          await this.userService.findByIdAndCheckExist(to_user);
          const chatbox = await this.chatboxService.findOneBy(
            from_user,
            to_user,
          );
          if (chatbox) {
            chatboxId = chatbox.id;
          }
        }
      }
      if (chatboxId) {
        const groupStatus =
          await this.groupStatusService.findByCodeAndCheckExist(
            GroupStatusCode.ACTIVE,
          );
        return await this.chatboxChatLogRepository.find({
          where: {
            chat_box_id: chatboxId,
            chat_box: { to_group_profile: { group_status_id: groupStatus.id } },
          },
          relations: [
            'chat_box',
            'chat_box.to_group_profile',
            'chat_log',
            'chat_log.content_type',
          ],
          select: {
            id: true,
            chat_box_id: true,
            chat_log_id: true,
            created_date: true,
            chat_log: {
              id: true,
              content: true,
              owner_id: true,
              created_date: true,
              content_type: { id: true, code: true },
            },
          },
        });
      }

      return [];
    } catch (ex) {
      Logger.error(ex);
      throw ex;
    }
  }
}
