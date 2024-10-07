import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  JoinColumn,
  ManyToOne,
  ManyToMany
} from 'typeorm';
import { User } from './user.entity';

@Entity('group')
export class Group {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  created_date: Date;

  @ManyToOne(() => User, (User) => User.id, {
    eager: true
  })
  @JoinColumn()
  group_lead: User;

  @ManyToMany(() => User, (user) => user.groups)
  members: User[];
}
