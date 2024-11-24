import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ChatLogContentType } from './chat_log_content_type.entity';

@Entity('chat_log')
export class ChatLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  from_user: string;

  @Column()
  to_user: string;

  @Column()
  to_group: string;

  @Column()
  content: string;

  @Column()
  created_date: Date;

  @Column()
  latest_updated_date: Date;

  @Column()
  content_type_id: string;

  @Column()
  owner_id: string;

  @ManyToOne(
    () => ChatLogContentType,
    (ChatLogContentType) => ChatLogContentType.id,
    { eager: false },
  )
  @JoinColumn({ name: 'content_type_id' })
  content_type: ChatLogContentType;
}
