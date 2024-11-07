import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { Profile } from './profile.entity';
import { GroupMembers } from './group_members.entity';

@Entity('user')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  password: string;

  @Column()
  phone: string;

  @Column()
  created_date: Date;

  @Column({ type: 'jsonb', default: [] })
  refresh_token_list: string[];

  @Column()
  active: boolean;

  @OneToMany(() => Profile, (Profile) => Profile.user, {
    eager: false,
    cascade: true,
  })
  @JoinColumn()
  profile: Profile[];

  @OneToMany(() => GroupMembers, (GroupMembers) => GroupMembers.group, {
    eager: false,
  })
  @JoinColumn()
  group_members: GroupMembers[];
}
