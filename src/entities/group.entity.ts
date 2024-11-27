import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  OneToMany,
  JoinColumn,
  ManyToOne,
} from 'typeorm';
import { GroupMembers } from './group_members.entity';
import { User } from './user.entity';

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

  @Column()
  owner_id: string;

  @OneToMany(() => GroupMembers, (GroupMembers) => GroupMembers.group, {
    eager: false,
  })
  @JoinColumn()
  group_members: GroupMembers[];

  @ManyToOne(() => User, (User) => User.id, { eager: false })
  @JoinColumn({ name: 'owner_id' })
  owner: User;
}
