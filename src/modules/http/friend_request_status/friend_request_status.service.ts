import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FriendRequestStatus } from 'src/entities';
import { AppError } from 'src/utils/AppError';
import { FriendRequestStatusCode } from 'src/utils/enums';
import { ErrorCode } from 'src/utils/error-code';
import { Repository } from 'typeorm';

@Injectable()
export class FriendRequestStatusService {
  constructor(
    @InjectRepository(FriendRequestStatus)
    private friendRequestStatusRepository: Repository<FriendRequestStatus>,
  ) {}

  async onModuleInit() {
    const statuses = await this.friendRequestStatusRepository.find();
    if (statuses.length === 0) {
      // only create new status if status is not found in the database.
      await this.friendRequestStatusRepository.save([
        {
          code: FriendRequestStatusCode.ACCEPTED,
          name: 'Accepted',
          created_date: new Date(Date.now()),
        },
        {
          code: FriendRequestStatusCode.DECLINED,
          name: 'Declined',
          created_date: new Date(Date.now()),
        },
        {
          code: FriendRequestStatusCode.PENDING,
          name: 'Pending',
          created_date: new Date(Date.now()),
        },
      ]);
    }
  }

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
