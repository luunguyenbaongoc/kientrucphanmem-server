import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { GroupStatus } from 'src/entities/group_status.entity';
import { AppError } from 'src/utils/AppError';
import { GroupStatusCode } from 'src/utils/enums';
import { ErrorCode } from 'src/utils/error-code';
import { Repository } from 'typeorm';

@Injectable()
export class GroupStatusService {
  constructor(
    @InjectRepository(GroupStatus)
    private groupStatusRepository: Repository<GroupStatus>,
  ) {}

  // async onModuleInit() {
  //   const roles = await this.groupStatusRepository.find();
  //   if (roles.length === 0) {
  //     await this.groupStatusRepository.save([
  //       { code: GroupStatusCode.ACTIVE, name: 'Active', created_date: new Date(Date.now()) },
  //       { code: GroupStatusCode.INACTIVE, name: 'Inactive', created_date: new Date(Date.now()) },
  //     ]);
  //   }
  // }

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
