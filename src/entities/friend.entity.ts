import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity('friend')
export class Friend {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  from_user: string;

  @Column()
  to_user: string;

  @Column()
  created_date: Date;

  @Column()
  friend_status_id: string;
}