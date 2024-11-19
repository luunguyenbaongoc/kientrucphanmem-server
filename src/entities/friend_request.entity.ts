import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity('friend_request')
export class FriendRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  from_user: string;

  @Column()
  to_user: string;

  @Column()
  created_date: Date;

  @Column()
  friend_request_status_id: string;

  @ManyToOne(() => User, (User) => User.id, { eager: false })
  @JoinColumn({ name: 'to_user' })
  to_user_profile: User;

  @ManyToOne(() => User, (User) => User.id, { eager: false })
  @JoinColumn({ name: 'from_user' })
  from_user_profile: User;
}
