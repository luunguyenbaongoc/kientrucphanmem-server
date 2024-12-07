import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Group } from './group.entity';
import { ChatBoxChatLog } from './chat_box_chat_log.entity';

@Entity('chat_box')
export class ChatBox {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  from_user: string;

  @Column({ nullable: true })
  to_user: string;

  @Column({ nullable: true })
  to_group: string;

  @Column()
  created_date: Date;

  @Column()
  latest_updated_date: Date;

  @Column()
  deleted: boolean;

  @Column()
  muted: boolean;

  @Column()
  new_message: boolean;

  @Column()
  last_accessed_date: Date;

  @ManyToOne(() => User, (User) => User.id, { eager: false })
  @JoinColumn({ name: 'to_user' })
  to_user_profile: User;

  @ManyToOne(() => Group, (Group) => Group.id, { eager: false })
  @JoinColumn({ name: 'to_group' })
  to_group_profile: Group;

  @OneToMany(
    () => ChatBoxChatLog,
    (ChatBoxChatLog) => ChatBoxChatLog.chat_box,
    {
      eager: false,
    },
  )
  @JoinColumn()
  chatbox_chatlogs: ChatBoxChatLog[];
}
