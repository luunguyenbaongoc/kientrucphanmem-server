import { GroupMembers } from 'src/entities/group_members.entity';

export type FindByUserResult = {
  groups: GroupMembers[];
  count: number;
};
