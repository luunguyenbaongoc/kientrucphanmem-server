import { Entity, Column, PrimaryColumn } from 'typeorm';

@Entity('group_members')
export class GroupMembers {
  @PrimaryColumn()
  group_id: string;

  @PrimaryColumn()
  user_id: string;

  @Column()
  created_by: string;

  @Column()
  created_date: Date;
}
