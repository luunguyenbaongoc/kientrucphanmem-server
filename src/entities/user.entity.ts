import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { Profile } from './profile.entity';
import { GroupMembers } from './group_members.entity';
import { Friend } from './friend.entity';
import { FriendRequest } from './friend_request.entity';

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

  @Column({ type: 'jsonb', default: [] })
  firebase_token_list: string[];

  @Column()
  active: boolean;

  @OneToMany(() => Profile, (Profile) => Profile.user, {
    eager: false,
  })
  @JoinColumn()
  profile: Profile[];

  @OneToMany(() => GroupMembers, (GroupMembers) => GroupMembers.group, {
    eager: false,
  })
  @JoinColumn()
  group_members: GroupMembers[];

  @OneToMany(() => Friend, (Friend) => Friend.to_user_profile, {
    eager: false,
  })
  @JoinColumn()
  to_user_friends: Friend[];

  @OneToMany(
    () => FriendRequest,
    (FriendRequest) => FriendRequest.to_user_profile,
    {
      eager: false,
    },
  )
  @JoinColumn()
  to_user_friend_requests: FriendRequest[];

  @OneToMany(
    () => FriendRequest,
    (FriendRequest) => FriendRequest.from_user_profile,
    {
      eager: false,
    },
  )
  @JoinColumn()
  from_user_friend_requests: FriendRequest[];
}
