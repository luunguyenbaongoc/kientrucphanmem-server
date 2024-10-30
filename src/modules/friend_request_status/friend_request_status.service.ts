import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FriendRequestStatus } from 'src/entities';
import { AppError } from 'src/utils/AppError';
import { ErrorCode } from 'src/utils/error-code';
import { Repository } from 'typeorm';

@Injectable()
export class FriendRequestStatusService {
  constructor(
    @InjectRepository(FriendRequestStatus)
    private friendRequestStatusRepository: Repository<FriendRequestStatus>,
  ) {}

  async findByCode(code: string): Promise<FriendRequestStatus | undefined> {
    try {
      return this.friendRequestStatusRepository.findOneBy({ code });
    } catch (ex) {
      Logger.error(ex);
      throw ex;
    }
  }

  async findByCodeAndCheckExist(
    code: string,
  ): Promise<FriendRequestStatus | undefined> {
    try {
      const friendRequestStatus = await this.findByCode(code);
      if (!friendRequestStatus) {
        throw new AppError(
          HttpStatus.BAD_REQUEST,
          ErrorCode.BAD_REQUEST,
          `Friend status ${code} không tồn tại`,
        );
      }
      return friendRequestStatus;
    } catch (ex) {
      Logger.error(ex);
      throw ex;
    }
  }
}
