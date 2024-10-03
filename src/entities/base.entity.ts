import { Column } from 'typeorm';

export class BaseEntity {
  @Column()
  createdby: string;

  @Column()
  createddate: Date;

  @Column()
  latestupdatedby: string;

  @Column()
  latestupdateddate: Date;
}
