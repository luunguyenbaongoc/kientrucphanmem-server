import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('emote')
export class Emote {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  code: string;

  @Column()
  name: string;

  @Column()
  created_date: Date;
}
