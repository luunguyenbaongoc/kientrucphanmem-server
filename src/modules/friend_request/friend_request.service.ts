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

@Injectable()
export class FriendRequestService {
  constructor(
    @InjectRepository(FriendRequest)
    private friendRequestRepository: Repository<FriendRequest>,
    private friendRequestStatusService: FriendRequestStatusService,
    private userService: UserService,
    private dataSource: DataSource,
  ) {}

  async makeRequest(
    userId: string,
    makeRequestDto: MakeRequestDto,
  ): Promise<FriendRequest | undefined> {
    try {
      const { to_user_phone } = makeRequestDto;
      const from_user = await this.userService.findByIdAndCheckExist(userId);
      const to_user = await this.userService.findByPhoneAndCheckExist(
        to_user_phone,
      );
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
      return await this.friendRequestRepository.findBy({
        to_user: user_id,
        friend_request_status_id: status.id,
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
      return await this.friendRequestRepository.findBy({
        from_user: user_id,
        friend_request_status_id: status.id,
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
      await queryRunner.manager.save(friend1);

      const friend2 = new Friend();
      friend2.from_user = acceptedRequest.to_user;
      friend2.to_user = acceptedRequest.from_user;
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
