import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { GroupStatus } from 'src/entities/group_status.entity';
import { AppError } from 'src/utils/AppError';
import { ErrorCode } from 'src/utils/error-code';
import { Repository } from 'typeorm';

@Injectable()
export class GroupStatusService {
  constructor(
    @InjectRepository(GroupStatus)
    private groupStatusRepository: Repository<GroupStatus>,
  ) {}

  async findByCode(code: string): Promise<GroupStatus | undefined> {
    try {
      return this.groupStatusRepository.findOneBy({ code });
    } catch (ex) {
      Logger.error(ex);
      throw ex;
    }
  }

  async findByCodeAndCheckExist(
    code: string,
  ): Promise<GroupStatus | undefined> {
    try {
      const GroupStatus = await this.findByCode(code);
      if (!GroupStatus) {
        throw new AppError(
          HttpStatus.BAD_REQUEST,
          ErrorCode.BAD_REQUEST,
          `Group status ${code} không tồn tại`,
        );
      }
      return GroupStatus;
    } catch (ex) {
      Logger.error(ex);
      throw ex;
    }
  }
}
