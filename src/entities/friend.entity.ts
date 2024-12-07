import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity('friend')
export class Friend {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  from_user: string;

  @Column()
  to_user: string;

  @Column()
  created_date: Date;

  @Column()
  deleted: boolean;

  @ManyToOne(() => User, (User) => User.id, { eager: false })
  @JoinColumn({ name: 'to_user' })
  to_user_profile: User;
}
