import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('group')
export class Group {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  code: string;

  @Column()
  created_by: string;

  @Column()
  created_date: Date;

  @Column()
  latest_updated_by: string;

  @Column()
  latest_updated_date: Date;

  @Column()
  group_id_status: string;
}
