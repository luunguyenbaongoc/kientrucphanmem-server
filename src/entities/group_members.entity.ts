import { Entity, Column, PrimaryColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Group } from './group.entity';
import { User } from './user.entity';

@Entity('group_members')
export class GroupMembers {
  @PrimaryColumn()
  group_id: string;

  @PrimaryColumn()
  user_id: string;

  @Column()
  created_by: string;

  @Column()
  created_date: Date;

  @ManyToOne(() => Group, (Group) => Group.id, { eager: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'group_id' })
  group: Group;

  @ManyToOne(() => User, (User) => User.id, { eager: false })
  @JoinColumn({ name: 'user_id' })
  user: User;
}
