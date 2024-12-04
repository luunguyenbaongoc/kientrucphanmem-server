import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ChatBox } from './chat_box.entity';
import { ChatLog } from './chat_log.entity';

@Entity('chat_box_chat_log')
export class ChatBoxChatLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  chat_box_id: string;

  @Column()
  chat_log_id: string;

  @Column()
  created_date: Date;

  @Column()
  deleted: boolean;

  @ManyToOne(() => ChatBox, (ChatBox) => ChatBox.id, { eager: false })
  @JoinColumn({ name: 'chat_box_id' })
  chat_box: ChatBox;

  @ManyToOne(() => ChatLog, (ChatLog) => ChatLog.id, { eager: false })
  @JoinColumn({ name: 'chat_log_id' })
  chat_log: ChatLog;
}
