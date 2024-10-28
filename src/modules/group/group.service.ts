import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Group } from 'src/entities';
import { User } from 'src/entities';
import { Repository, DataSource } from 'typeorm';
import { CreateGroupDto } from './dto';
import { UserService } from '../user/user.service';
import { CreateGroupResult } from './types';

@Injectable()
export class GroupService {
  constructor(
    @InjectRepository(Group)
    private groupRepository: Repository<Group>,
    private readonly userService: UserService,
    private dataSource: DataSource,
  ) {}

  async findByName(name: string): Promise<Group | undefined> {
    return await this.groupRepository.findOneBy({ name });
  }

  // async createGroup(
  //   leadId: string,
  //   createGroupDto: CreateGroupDto,
  // ): Promise<CreateGroupResult | undefined> {
  //   const queryRunner = this.dataSource.createQueryRunner();
  //   try {
  //     const { name } = { ...createGroupDto };

  //     const createGroupResult: CreateGroupResult = {
  //       id: null,
  //       name: null,
  //       error: null,
  //       group_lead: null,
  //     };

  //     const user: User = await this.userService.findByIdAndCheckExist(leadId);

  //     await queryRunner.connect();
  //     await queryRunner.startTransaction();

  //     const newGroup: Group = new Group();
  //     newGroup.name = name;
  //     newGroup.group_lead = user;
  //     newGroup.created_date = new Date();
  //     const addedGroup = await queryRunner.manager.save(newGroup);

  //     await queryRunner.commitTransaction();

  //     return {
  //       ...createGroupResult,
  //       id: newGroup.id,
  //       name: addedGroup.name,
  //       group_lead: {
  //         id: addedGroup.group_lead.id,
  //       },
  //     };
  //   } catch (ex) {
  //     Logger.error(ex);
  //     await queryRunner.rollbackTransaction();
  //     throw ex;
  //   } finally {
  //     await queryRunner.release();
  //   }
  // }

  async saveGroup(group: Group): Promise<Group | undefined> {
    await this.groupRepository.save(group);
    return await this.groupRepository.findOneBy({ id: group.id });
  }

  async findById(id: string): Promise<Group | undefined> {
    return await this.groupRepository.findOneBy({ id });
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
