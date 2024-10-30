import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity('friend_request_status')
export class FriendRequestStatus {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  code: string;

  @Column()
  name: string;

  @Column()
  created_date: Date;
}