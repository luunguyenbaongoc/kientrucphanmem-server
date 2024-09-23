import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { Profile } from './profile.entity';

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

  @OneToOne(() => Profile, (Profile) => Profile.user, {
    eager: false,
  })
  @JoinColumn()
  profile: Profile;
}
