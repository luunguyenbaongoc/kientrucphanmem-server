import { ChatLog } from 'src/entities';

export type ListByUserResult = {
  data: ChatLog[];
  count: number;
};
