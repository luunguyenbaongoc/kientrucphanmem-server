import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Friend } from 'src/entities';
import { Repository } from 'typeorm';
import { AddFriendDto, UpdateFriendDto } from './dto';
import { UserService } from '../user/user.service';
import { AppError } from 'src/utils/AppError';
import { ErrorCode } from 'src/utils/error-code';
import { FriendStatusService } from '../friend_status/friend_status.service';
import { FriendStatusCode } from 'src/utils/enums';

@Injectable()
export class FriendService {
  constructor(
    @InjectRepository(Friend)
    private friendRepository: Repository<Friend>,
    private userService: UserService,
    private friendStatusService: FriendStatusService,
  ) {}

  async findFriendBy(from_user: string, to_user: string) {
    const friend = this.friendRepository.findOneBy({
      from_user,
      to_user,
    });
    return friend;
  }

  async addFriend(
    userId: string,
    addFriendDto: AddFriendDto,
  ): Promise<Friend | undefined> {
    try {
      await this.userService.findByIdAndCheckExist(userId);
      const toUser = await this.userService.findByPhoneAndCheckExist(
        addFriendDto.to_user_phone,
      );
      const findFriend = await this.findFriendBy(userId, toUser.id);
      if (findFriend) {
        throw new AppError(
          HttpStatus.BAD_REQUEST,
          ErrorCode.BAD_REQUEST,
          `Người dùng số điện thoại ${addFriendDto.to_user_phone} đã có trong danh sách bạn bè`,
        );
      }

      const friendStatus =
        await this.friendStatusService.findByCodeAndCheckExist(
          FriendStatusCode.PENDING,
        );

      const newFriend = new Friend();
      newFriend.from_user = userId;
      newFriend.to_user = toUser.id;
      newFriend.friend_status_id = friendStatus.id;
      await this.friendRepository.insert(newFriend);

      return await this.findFriendBy(userId, toUser.id);
    } catch (ex) {
      Logger.error(ex);
      throw ex;
    }
  }

  async findById(id: string): Promise<Friend | undefined> {
    return await this.friendRepository.findOneBy({ id });
  }

  async listFriendByFriendStatus(statusCode: string): Promise<Friend[] | undefined> {
    const friendStatus = await this.friendStatusService.findByCodeAndCheckExist(
      statusCode,
    );

    return await this.friendRepository.findBy({
      friend_status_id: friendStatus.id,
    });
  }

  async findByIdAndCheckExist(id: string): Promise<Friend | undefined> {
    try {
      const friend = await this.findById(id);
      if (!friend) {
        throw new AppError(
          HttpStatus.BAD_REQUEST,
          ErrorCode.BAD_REQUEST,
          `Friend id ${id} không tồn tại`,
        );
      }
      return friend;
    } catch (ex) {
      Logger.error(ex);
      throw ex;
    }
  }

  async updateFriend(
    updateFriendDto: UpdateFriendDto,
  ): Promise<Friend | undefined> {
    try {
      const friend = await this.findByIdAndCheckExist(updateFriendDto.id);
      const friendStatus =
        await this.friendStatusService.findByCodeAndCheckExist(
          updateFriendDto.friend_status_code,
        );

      friend.friend_status_id = friendStatus.id;
      await this.friendRepository.save(friend);

      return friend;
    } catch (ex) {
      Logger.error(ex);
      throw ex;
    }
  }
}
