import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('group_status')
export class GroupStatus {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  code: string;

  @Column()
  name: string;

  @Column()
  created_date: Date;
}
