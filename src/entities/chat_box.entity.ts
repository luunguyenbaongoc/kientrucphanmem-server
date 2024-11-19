import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('chat_box')
export class ChatBox {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  from_user: string;

  @Column()
  to_user: string;

  @Column()
  to_group: string;

  @Column()
  created_date: Date;

  @Column()
  latest_updated_date: Date;

  @Column()
  deleted: boolean;

  @Column()
  muted: boolean;
}
