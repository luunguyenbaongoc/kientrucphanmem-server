import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Friend } from 'src/entities';
import { DataSource, Repository } from 'typeorm';
import { AddFriendDto, UpdateFriendDto } from './dto';
import { UserService } from '../user/user.service';
import { AppError } from 'src/utils/AppError';
import { ErrorCode } from 'src/utils/error-code';

@Injectable()
export class FriendService {
  constructor(
    @InjectRepository(Friend)
    private friendRepository: Repository<Friend>,
    private userService: UserService,
    private dataSource: DataSource,
  ) {}

  async findFriendBy(from_user: string, to_user: string) {
    const friend = this.friendRepository.findOneBy({
      from_user,
      to_user,
    });
    return friend;
  }

  async addFriend(addFriendDto: AddFriendDto): Promise<Friend | undefined> {
    try {
      const { from_user, to_user } = addFriendDto;
      await this.userService.findByIdAndCheckExist(from_user);
      await this.userService.findByIdAndCheckExist(to_user);

      const newFriend = new Friend();
      newFriend.from_user = from_user;
      newFriend.to_user = to_user;
      await this.friendRepository.insert(newFriend);

      return await this.findFriendBy(from_user, to_user);
    } catch (ex) {
      Logger.error(ex);
      throw ex;
    }
  }

  async findById(id: string): Promise<Friend | undefined> {
    return await this.friendRepository.findOneBy({ id });
  }

  async listFriend(from_user: string): Promise<Friend[] | undefined> {
    return await this.friendRepository.findBy({ from_user, deleted: false });
  }

  // async listFriendByFriendStatus(
  //   statusCode: string,
  // ): Promise<Friend[] | undefined> {
  //   const friendStatus = await this.friendStatusService.findByCodeAndCheckExist(
  //     statusCode,
  //   );

  //   return await this.friendRepository.findBy({
  //     friend_status_id: friendStatus.id,
  //   });
  // }

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

  async findBy(
    from_user: string,
    to_user: string,
  ): Promise<Friend | undefined> {
    try {
      return await this.friendRepository.findOneBy({ from_user, to_user });
    } catch (ex) {
      Logger.error(ex);
      throw ex;
    }
  }

  async deleteFriend(
    from_user: string,
    to_user: string,
  ): Promise<boolean | undefined> {
    const queryRunner = this.dataSource.createQueryRunner();
    try {
      await this.userService.findByIdAndCheckExist(from_user);
      await this.userService.findByIdAndCheckExist(to_user);

      await queryRunner.connect();
      await queryRunner.startTransaction();

      const friend1 = await this.findBy(from_user, to_user);
      const friend2 = await this.findBy(to_user, from_user);
      if (!friend1 || !friend2) {
        throw new AppError(
          HttpStatus.BAD_REQUEST,
          ErrorCode.BAD_REQUEST,
          `Lỗi hệ thống`,
        );
      }

      friend1.deleted = true;
      friend2.deleted = true;
      await queryRunner.manager.save(friend1);
      await queryRunner.manager.save(friend2);

      await queryRunner.commitTransaction();

      return true;
    } catch (ex) {
      Logger.error(ex);
      await queryRunner.rollbackTransaction();
      throw ex;
    } finally {
      await queryRunner.release();
    }
  }

  async updateFriend(
    updateFriendDto: UpdateFriendDto,
  ): Promise<Friend | undefined> {
    try {
      const friend = await this.findByIdAndCheckExist(updateFriendDto.id);

      friend.deleted = updateFriendDto.deleted;
      await this.friendRepository.save(friend);

      return friend;
    } catch (ex) {
      Logger.error(ex);
      throw ex;
    }
  }
}
