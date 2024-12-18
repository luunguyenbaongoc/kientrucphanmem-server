import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Friend } from 'src/entities';
import { DataSource, FindOperator, ILike, Repository } from 'typeorm';
import { AddFriendDto, FindByTextDto, UpdateFriendDto } from './dto';
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

  // async findFriendBy(from_user: string, to_user: string) {
  //   const friend = this.friendRepository.findOneBy({
  //     from_user,
  //     to_user,
  //     deleted: false,
  //   });
  //   return friend;
  // }

  async isFriend(from_user: string, to_user: string) {
    const friend = await this.findBy(from_user, to_user);
    if (friend) {
      return true;
    }
    return false;
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

      return await this.findBy(from_user, to_user);
    } catch (ex) {
      Logger.error(ex);
      throw ex;
    }
  }

  async findById(id: string): Promise<Friend | undefined> {
    return await this.friendRepository.findOneBy({ id });
  }

  async listFriend(from_user: string): Promise<Friend[] | undefined> {
    return await this.friendRepository.find({
      where: { from_user, deleted: false },
      relations: ['to_user_profile.profile'],
      select: {
        id: true,
        to_user_profile: {
          id: true,
          profile: { fullname: true, avatar: true, id: true },
        },
      },
    });
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
    deleted: boolean = false,
  ): Promise<Friend | undefined> {
    try {
      return await this.friendRepository.findOneBy({
        from_user,
        to_user,
        deleted,
      });
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

  async findByText(
    userId: string,
    findByTextDto: FindByTextDto,
  ): Promise<any[] | undefined> {
    try {
      if (!findByTextDto.text) {
        return await this.listFriend(userId);
      }
      const phoneRegex = /^\d+$/;
      const isPhoneText: boolean = phoneRegex.test(findByTextDto.text);
      const findOperator: FindOperator<string> = ILike(
        `%${findByTextDto.text}%`,
      );
      const profileQuery = isPhoneText
        ? { phone: findOperator }
        : { profile: { fullname: findOperator } };
      return await this.friendRepository.find({
        where: {
          from_user: userId,
          to_user_profile: profileQuery,
          deleted: false,
        },
        relations: ['to_user_profile', 'to_user_profile.profile'],
        select: {
          id: true,
          to_user_profile: {
            id: true,
            phone: isPhoneText,
            profile: { fullname: true, avatar: true, id: true },
          },
        },
      });
    } catch (ex) {
      Logger.error(ex);
      throw ex;
    }
  }
}
