import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FriendStatus } from 'src/entities';
import { AppError } from 'src/utils/AppError';
import { ErrorCode } from 'src/utils/error-code';
import { Repository } from 'typeorm';

@Injectable()
export class FriendStatusService {
  constructor(
    @InjectRepository(FriendStatus)
    private friendStatusRepository: Repository<FriendStatus>,
  ) {}

  async findByCode(code: string): Promise<FriendStatus | undefined> {
    try {
      return this.friendStatusRepository.findOneBy({ code });
    } catch (ex) {
      Logger.error(ex);
      throw ex;
    }
  }

  async findByCodeAndCheckExist(
    code: string,
  ): Promise<FriendStatus | undefined> {
    try {
      const friendStatus = await this.findByCode(code);
      if (!friendStatus) {
        throw new AppError(
          HttpStatus.BAD_REQUEST,
          ErrorCode.BAD_REQUEST,
          `Friend status ${code} không tồn tại`,
        );
      }
      return friendStatus;
    } catch (ex) {
      Logger.error(ex);
      throw ex;
    }
  }
}
