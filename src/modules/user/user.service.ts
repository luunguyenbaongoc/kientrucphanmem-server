import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/entities';
import { Repository } from 'typeorm';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async findUserByPhone(phone: string): Promise<User | undefined> {
    return await this.usersRepository.findOneBy({ phone });
  }

  async addUser(user: User): Promise<User | undefined> {
    await this.usersRepository.insert(user);
    return await this.usersRepository.findOneBy({ phone: user.phone });
  }
}
