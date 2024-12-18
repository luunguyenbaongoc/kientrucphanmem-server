import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('friend_status')
export class FriendStatus {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  code: string;

  @Column()
  name: string;

  @Column()
  created_date: Date;
}
