import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('chat_log_content_type')
export class ChatLogContentType {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  code: string;

  @Column()
  name: string;

  @Column()
  created_date: Date;
}
