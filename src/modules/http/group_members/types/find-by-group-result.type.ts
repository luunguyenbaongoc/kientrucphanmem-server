import { GroupMembers } from 'src/entities/group_members.entity';

export type FindByGroupResult = {
  users: GroupMembers[];
  count: number;
};
