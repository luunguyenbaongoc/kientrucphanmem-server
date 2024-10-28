import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Group } from 'src/entities';
import { Repository } from 'typeorm';
import { UserService } from '../user/user.service';
import { AppError } from 'src/utils/AppError';
import { ErrorCode } from 'src/utils/error-code';
import { AddGroupDto, UpdateGroupDto } from './dto';
import { GroupStatusService } from '../group_status/group_status.service';
import { GroupStatusCode } from 'src/utils/enums';
import { genRandomCode } from 'src/helpers';

@Injectable()
export class GroupService {
  constructor(
    @InjectRepository(Group)
    private groupRepository: Repository<Group>,
    private userService: UserService,
    private groupStatusService: GroupStatusService,
  ) {}

  async findByName(name: string): Promise<Group | undefined> {
    return await this.groupRepository.findOneBy({ name });
  }

  async addGroup(
    userId: string,
    addGroupDto: AddGroupDto,
  ): Promise<Group | undefined> {
    try {
      await this.userService.findByIdAndCheckExist(userId);

      const groupStatus = await this.groupStatusService.findByCodeAndCheckExist(
        GroupStatusCode.ACTIVE,
      );

      const newGroup = new Group();
      newGroup.name = addGroupDto.name;
      newGroup.created_by = userId;
      newGroup.group_id_status = groupStatus.id;
      newGroup.code = genRandomCode();
      await this.groupRepository.insert(newGroup);

      return await this.findByCode(newGroup.code);
    } catch (ex) {
      Logger.error(ex);
      throw ex;
    }
  }

  async updateGroup(
    userId: string,
    updateGroupDto: UpdateGroupDto,
  ): Promise<Group | undefined> {
    try {
      await this.userService.findByIdAndCheckExist(userId);
      const group = await this.findByIdAndCheckExist(updateGroupDto.id);
      const groupStatus = await this.groupStatusService.findByCodeAndCheckExist(
        updateGroupDto.group_status_code,
      );

      group.name = updateGroupDto.name;
      group.group_id_status = groupStatus.id;
      group.latest_updated_by = userId;
      group.latest_updated_date = new Date();

      await this.groupRepository.save(group);

      return group;
    } catch (ex) {
      Logger.error(ex);
      throw ex;
    }
  }

  async findById(id: string): Promise<Group | undefined> {
    return await this.groupRepository.findOneBy({ id });
  }

  async findByIdAndCheckExist(id: string): Promise<Group | undefined> {
    try {
      const group = await this.findById(id);
      if (!group) {
        throw new AppError(
          HttpStatus.BAD_REQUEST,
          ErrorCode.BAD_REQUEST,
          `Group id ${id} không tồn tại`,
        );
      }
      return group;
    } catch (ex) {
      Logger.error(ex);
      throw ex;
    }
  }

  async findByCode(code: string): Promise<Group | undefined> {
    return await this.groupRepository.findOneBy({ code });
  }

  // async findByUserId(userId: string): Promise<Group[] | undefined> {
  //   //TODO: just return enough information, not sensitive info
  //   return await this.groupRepository.find({
  //     where: { group_lead: { id: userId } },
  //   });
  // }

  async deleteGroupById(groupId: string): Promise<void> {
    const group = await this.findById(groupId);
    if (!group) {
      throw new Error('Group not found');
    }

    await this.groupRepository.delete(groupId);
  }
}
