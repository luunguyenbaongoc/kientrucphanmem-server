import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/entities';
import { AppError } from 'src/utils/AppError';
import { ErrorCode } from 'src/utils/error-code';
import { Repository } from 'typeorm';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async findUserByPhone(phone: string): Promise<User | undefined> {
    return await this.userRepository.findOneBy({ phone });
  }

  async addUser(user: User): Promise<User | undefined> {
    await this.userRepository.insert(user);
    return await this.userRepository.findOneBy({ phone: user.phone });
  }

  async addRefreshToken(id: string, refreshToken: string): Promise<void> {
    const user = await this.userRepository.findOneBy({ id });
    if (!user) {
      throw new AppError(
        HttpStatus.BAD_REQUEST,
        ErrorCode.BAD_REQUEST,
        `Người dùng không tồn tại`,
      );
    }

    user.refresh_token_list.push(refreshToken);
    await this.userRepository.save(user);
  }

  async saveUser(user: User): Promise<User | undefined> {
    await this.userRepository.save(user);
    return await this.userRepository.findOneBy({ id: user.id });
  }
}
