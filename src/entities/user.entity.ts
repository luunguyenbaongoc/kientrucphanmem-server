import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('user')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  username: string;

  @Column()
  password: string;

  @Column()
  phone: string;

  @Column()
  createddate: Date;

  // @Column({ type: 'jsonb', default: [] })
  // refreshtokenlist: string[];

  @Column()
  active: boolean;
}
