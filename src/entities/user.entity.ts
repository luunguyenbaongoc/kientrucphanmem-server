import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  JoinColumn,
  OneToMany,
  ManyToMany,
  JoinTable
} from 'typeorm';
import { Group } from './group.entity';
import { Profile } from './profile.entity';

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
  })
  @JoinColumn()
  profile: Profile[];

  @ManyToMany(() => Group, (group) => group.members, {
    eager: false
  })
  @JoinTable()
  groups: Group[];
}
