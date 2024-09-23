import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity('profile')
export class Profile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  fullname: string;

  @Column()
  avatar: string;

  @OneToOne(() => User, (User) => User.id, { eager: false })
  @JoinColumn({ name: 'user_id' })
  user: User;
}
