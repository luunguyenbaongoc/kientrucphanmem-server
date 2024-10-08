import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { User } from './user.entity';

@Entity('profile')
export class Profile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  fullname: string;

  @Column({ nullable: true })
  avatar: string;

  @Column()
  user_id: string;

  @OneToMany(() => User, (User) => User.id, { eager: false })
  @JoinColumn({ name: 'user_id' })
  user: User;
}
