import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

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

  @Column()
  emote_id: string;
}
