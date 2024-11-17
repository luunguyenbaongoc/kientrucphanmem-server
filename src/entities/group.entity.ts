import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { GroupMembers } from './group_members.entity';

@Entity('group')
export class Group {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  code: string;

  @Column()
  created_by: string;

  @Column()
  created_date: Date;

  @Column()
  latest_updated_by: string;

  @Column()
  latest_updated_date: Date;

  @Column()
  group_status_id: string;

  @Column({ nullable: true })
  avatar: string;

  @Column({ nullable: true })
  description: string;

  @OneToMany(() => GroupMembers, (GroupMembers) => GroupMembers.group, {
    eager: false,
    cascade: [ 'remove']
  })
  @JoinColumn()
  group_members: GroupMembers[];
}
