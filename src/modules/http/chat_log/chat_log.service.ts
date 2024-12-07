import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ChatBox, ChatBoxChatLog, ChatLog } from 'src/entities';
import { DataSource, Repository } from 'typeorm';
import { InsertDto } from './dto';
import { UserService } from '../user/user.service';
import { ChatLogContentTypeService } from '../chat_log_content_type/chat_log_content_type.service';
import { ChatBoxService } from '../chat_box/chat_box.service';
import { GroupMembersService } from '../group_members/group_members.service';
import { AppError } from 'src/utils/AppError';
import { ErrorCode } from 'src/utils/error-code';
import { ChatGateway } from 'src/modules/socket/chat/chat.gateway';
import { CloudMessagingService } from 'src/modules/firebase/cloud-messaging/cloud-messaging.service';
import { Platform } from 'src/utils/enums';

@Injectable()
export class ChatLogService {
  constructor(
    @InjectRepository(ChatLog)
    private chatLogRepository: Repository<ChatLog>,
    private userService: UserService,
    private chatlogContentTypeService: ChatLogContentTypeService,
    private dataSource: DataSource,
    private chatboxService: ChatBoxService,
    private groupmembersService: GroupMembersService,
    private chatGateway: ChatGateway,
    private cloudMessagingService: CloudMessagingService,
  ) {}
  private readonly logger = new Logger(ChatLogService.name);

  async insert(
    ownerId: string,
    insertDto: InsertDto,
  ): Promise<ChatLog | undefined> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const {
        content,
        content_type_code,
        created_date,
        is_group_chat,
        to_id,
        platform,
      } = insertDto;
      const owner_id = ownerId;

      await this.userService.findByIdAndCheckExist(owner_id);
      const chatlogContentType =
        await this.chatlogContentTypeService.findByCodeAndCheckExist(
          content_type_code,
        );

      const newChatLog = new ChatLog();
      newChatLog.owner_id = owner_id;
      newChatLog.content = content;
      newChatLog.content_type_id = chatlogContentType.id;
      newChatLog.created_date = created_date;
      await queryRunner.manager.save(newChatLog);

      if (is_group_chat) {
        const { count, users } = await this.groupmembersService.findByGroupId(
          to_id,
        );
        if (count === 0) {
          throw new AppError(
            HttpStatus.BAD_REQUEST,
            ErrorCode.BAD_REQUEST,
            `Nhóm ${to_id} không có thành viên. Vui lòng thử lại.`,
          );
        }
        for (const user of users) {
          const { user_id } = user;
          let groupChatBox = await this.chatboxService.findOneBy(
            user_id,
            null,
            to_id,
          );
          if (!groupChatBox) {
            groupChatBox = new ChatBox();
            groupChatBox.from_user = user_id;
            groupChatBox.to_group = to_id;
            groupChatBox.last_accessed_date = created_date;
            groupChatBox.latest_updated_date = created_date;
            groupChatBox.new_message = true;
            await queryRunner.manager.save(groupChatBox);
          }
          groupChatBox.latest_updated_date = created_date;
          groupChatBox.new_message = user_id !== ownerId ? true : false;
          await queryRunner.manager.save(groupChatBox);

          const newGroupChatBoxChatLog = new ChatBoxChatLog();
          newGroupChatBoxChatLog.chat_box_id = groupChatBox.id;
          newGroupChatBoxChatLog.chat_log_id = newChatLog.id;
          newGroupChatBoxChatLog.created_date = created_date;
          await queryRunner.manager.save(newGroupChatBoxChatLog);
        }

        await queryRunner.commitTransaction();

        //send socket to users in group except owner when all messages were saved to db
        for (const user of users) {
          const toUserId = user.user_id;
          if (user.user_id !== ownerId) {
            this.chatGateway.sendCreatedMessage(ownerId, toUserId, to_id, true);
          }
          const firebaseTokenList = await this.userService.getFirebaseTokenList(
            toUserId,
          );
          if (firebaseTokenList.length > 0) {
            this.cloudMessagingService.sendMulticastMessage({
              content: 'Tin nhắn mới',
              title: 'Tin nhắn mới',
              tokens: firebaseTokenList,
              data: { payloadId: to_id, isGroupChat: true.toString() },
            });
          }
        }
      } else {
        let ownerChatBox = await this.chatboxService.findOneBy(owner_id, to_id);
        if (!ownerChatBox) {
          ownerChatBox = new ChatBox();
          ownerChatBox.from_user = owner_id;
          ownerChatBox.to_user = to_id;
          ownerChatBox.last_accessed_date = created_date;
          ownerChatBox.latest_updated_date = created_date;
          ownerChatBox.new_message = true;
          await queryRunner.manager.save(ownerChatBox);
        }
        ownerChatBox.latest_updated_date = created_date;
        // ownerChatBox.new_message = true;
        await queryRunner.manager.save(ownerChatBox);

        const newOwnerChatBoxChatLog = new ChatBoxChatLog();
        newOwnerChatBoxChatLog.chat_box_id = ownerChatBox.id;
        newOwnerChatBoxChatLog.chat_log_id = newChatLog.id;
        newOwnerChatBoxChatLog.created_date = created_date;
        await queryRunner.manager.save(newOwnerChatBoxChatLog);

        let toUserChatBox = await this.chatboxService.findOneBy(
          to_id,
          owner_id,
        );
        if (!toUserChatBox) {
          toUserChatBox = new ChatBox();
          toUserChatBox.from_user = to_id;
          toUserChatBox.to_user = owner_id;
          toUserChatBox.last_accessed_date = created_date;
          toUserChatBox.latest_updated_date = created_date;
          toUserChatBox.new_message = true;
          await queryRunner.manager.save(toUserChatBox);
        }
        toUserChatBox.latest_updated_date = created_date;
        toUserChatBox.new_message = true;
        await queryRunner.manager.save(toUserChatBox);

        const newToUserChatBoxChatLog = new ChatBoxChatLog();
        newToUserChatBoxChatLog.chat_box_id = toUserChatBox.id;
        newToUserChatBoxChatLog.chat_log_id = newChatLog.id;
        newToUserChatBoxChatLog.created_date = created_date;
        await queryRunner.manager.save(newToUserChatBoxChatLog);

        await queryRunner.commitTransaction();

        //send socket to user when message is saved to db
        this.chatGateway.sendCreatedMessage(ownerId, to_id, ownerId, false);
        const firebaseTokenList = await this.userService.getFirebaseTokenList(
          to_id,
        );
        if (firebaseTokenList.length > 0) {
          this.cloudMessagingService.sendMulticastMessage({
            content: 'Tin nhắn mới',
            title: 'Tin nhắn mới',
            tokens: firebaseTokenList,
            data: { payloadId: ownerId, isGroupChat: false.toString() },
          });
        }
      }

      if (platform === Platform.MOBILE) {
        //send socket to sender when sent message from mobile
        this.chatGateway.sendMessageToOwner(ownerId, ownerId, false);
      } else {
        //send firebase message to sender when sent message from web
        const firebaseTokenList = await this.userService.getFirebaseTokenList(
          ownerId,
        );
        if (firebaseTokenList.length > 0) {
          this.cloudMessagingService.sendMulticastMessage({
            content: 'Tin nhắn mới',
            title: 'Tin nhắn mới',
            tokens: firebaseTokenList,
            data: { payloadId: ownerId, isGroupChat: false },
          });
        }
      }

      return newChatLog;
    } catch (ex) {
      this.logger.error(ex);
      await queryRunner.rollbackTransaction();
      throw ex;
    } finally {
      await queryRunner.release();
    }
  }
}
