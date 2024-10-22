export type CreateGroupResult = {
  id: string;
  name: string;
  error?: string;
  group_lead: {
    id: string;
  };
};
