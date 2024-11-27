import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Friend, FriendRequest } from 'src/entities';
import { DataSource, Repository } from 'typeorm';
import { FriendRequestStatusService } from '../friend_request_status/friend_request_status.service';
import { MakeRequestDto } from './dto';
import { UserService } from '../user/user.service';
import { FriendRequestStatusCode } from 'src/utils/enums';
import { AppError } from 'src/utils/AppError';
import { ErrorCode } from 'src/utils/error-code';
import { UpdateRequestDto } from './dto/update-request.dto';
import { FriendService } from '../friend/friend.service';

@Injectable()
export class FriendRequestService {
  constructor(
    @InjectRepository(FriendRequest)
    private friendRequestRepository: Repository<FriendRequest>,
    private friendRequestStatusService: FriendRequestStatusService,
    private userService: UserService,
    private dataSource: DataSource,
    private friendService: FriendService,
  ) {}

  async makeRequest(
    userId: string,
    makeRequestDto: MakeRequestDto,
  ): Promise<FriendRequest | undefined> {
    try {
      const { to_user_phone } = makeRequestDto;
      const from_user = await this.userService.findByIdAndCheckExist(userId);
      if (to_user_phone === from_user.phone) {
        throw new AppError(
          HttpStatus.BAD_REQUEST,
          ErrorCode.BAD_REQUEST,
          `Không thể gửi lời mời kết bạn tới chính bản thân mình.`,
        );
      }
      const to_user = await this.userService.findByPhoneAndCheckExist(
        to_user_phone,
      );
      const isFriend = await this.friendService.isFriend(userId, to_user.id);
      if (isFriend) {
        throw new AppError(
          HttpStatus.BAD_REQUEST,
          ErrorCode.BAD_REQUEST,
          `Bạn và người dùng ${to_user_phone} đã là bạn bè`,
        );
      }
      const request = await this.findByContitions(
        from_user.id,
        to_user.id,
        FriendRequestStatusCode.PENDING,
      );

      if (request) {
        throw new AppError(
          HttpStatus.BAD_REQUEST,
          ErrorCode.BAD_REQUEST,
          `Đã gửi lời mời kết bạn tới người dùng ${to_user_phone}. Vui lòng chờ phản hồi`,
        );
      }

      const status =
        await this.friendRequestStatusService.findByCodeAndCheckExist(
          FriendRequestStatusCode.PENDING,
        );
      const newRequest = new FriendRequest();
      newRequest.from_user = from_user.id;
      newRequest.to_user = to_user.id;
      newRequest.friend_request_status_id = status.id;
      newRequest.created_date = new Date();
      await this.friendRequestRepository.insert(newRequest);

      return await this.findByContitions(
        from_user.id,
        to_user.id,
        FriendRequestStatusCode.PENDING,
      );
    } catch (ex) {
      Logger.error(ex);
      throw ex;
    }
  }

  async findByContitions(
    from_user: string,
    to_user: string,
    status_code: string,
  ): Promise<FriendRequest | undefined> {
    try {
      const status =
        await this.friendRequestStatusService.findByCodeAndCheckExist(
          status_code,
        );
      return await this.friendRequestRepository.findOneBy({
        from_user,
        to_user,
        friend_request_status_id: status.id,
      });
    } catch (ex) {
      Logger.error(ex);
      throw ex;
    }
  }

  async listReceivedRequest(
    user_id: string,
  ): Promise<FriendRequest[] | undefined> {
    try {
      const status =
        await this.friendRequestStatusService.findByCodeAndCheckExist(
          FriendRequestStatusCode.PENDING,
        );
      return await this.friendRequestRepository.find({
        where: {
          to_user: user_id,
          friend_request_status_id: status.id,
        },
        relations: ['from_user_profile.profile'],
        select: {
          id: true,
          from_user_profile: {
            id: true,
            profile: { fullname: true, avatar: true, id: true },
          },
        },
      });
    } catch (ex) {
      Logger.error(ex);
      throw ex;
    }
  }

  async listSentRequest(user_id: string): Promise<FriendRequest[] | undefined> {
    try {
      const status =
        await this.friendRequestStatusService.findByCodeAndCheckExist(
          FriendRequestStatusCode.PENDING,
        );
      return await this.friendRequestRepository.find({
        where: {
          from_user: user_id,
          friend_request_status_id: status.id,
        },
        relations: ['to_user_profile.profile'],
        select: {
          id: true,
          to_user_profile: {
            id: true,
            profile: { fullname: true, avatar: true, id: true },
          },
        },
      });
    } catch (ex) {
      Logger.error(ex);
      throw ex;
    }
  }

  async findById(id: string): Promise<FriendRequest | undefined> {
    try {
      return await this.friendRequestRepository.findOneBy({ id });
    } catch (ex) {
      Logger.error(ex);
      throw ex;
    }
  }

  async findByIdAndCheckExist(id: string): Promise<FriendRequest | undefined> {
    const requestById = await this.findById(id);
    if (!requestById) {
      throw new AppError(
        HttpStatus.BAD_REQUEST,
        ErrorCode.BAD_REQUEST,
        `Friend request ${id} không tồn tại`,
      );
    }
    return requestById;
  }

  async updateRequest(
    updateRequestDto: UpdateRequestDto,
  ): Promise<FriendRequest | undefined> {
    try {
      const { id, status_code } = updateRequestDto;
      const request = await this.findByIdAndCheckExist(id);
      const status =
        await this.friendRequestStatusService.findByCodeAndCheckExist(
          status_code,
        );

      request.friend_request_status_id = status.id;
      await this.friendRequestRepository.save(request);

      return request;
    } catch (ex) {
      Logger.error(ex);
      throw ex;
    }
  }

  async acceptRequest(requestId: string): Promise<FriendRequest | undefined> {
    const queryRunner = this.dataSource.createQueryRunner();

    try {
      const acceptedRequest = await this.findByIdAndCheckExist(requestId);
      const status =
        await this.friendRequestStatusService.findByCodeAndCheckExist(
          FriendRequestStatusCode.ACCEPTED,
        );

      await queryRunner.connect();
      await queryRunner.startTransaction();

      acceptedRequest.friend_request_status_id = status.id;
      await queryRunner.manager.save(acceptedRequest);

      const friend1 = new Friend();
      friend1.from_user = acceptedRequest.from_user;
      friend1.to_user = acceptedRequest.to_user;
      friend1.created_date = new Date();
      friend1.deleted = false;
      await queryRunner.manager.save(friend1);

      const friend2 = new Friend();
      friend2.from_user = acceptedRequest.to_user;
      friend2.to_user = acceptedRequest.from_user;
      friend2.created_date = new Date();
      friend2.deleted = false;
      await queryRunner.manager.save(friend2);

      await queryRunner.commitTransaction();

      return acceptedRequest;
    } catch (ex) {
      Logger.error(ex);
      await queryRunner.rollbackTransaction();
      throw ex;
    } finally {
      await queryRunner.release();
    }
  }
}
