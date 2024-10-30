import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity('friend_request')
export class FriendRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  from_user: string;

  @Column()
  to_user: string;

  @Column()
  created_date: Date;

  @Column()
  friend_request_status_id: string;
}