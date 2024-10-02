import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { UserService } from '../user/user.service';
import { RegisterDto } from './dto/register.dto';
import { AppError } from 'src/utils/AppError';
import { ErrorCode } from 'src/utils/error-code';
import { RegisterResult } from './types';
import { Profile, User } from 'src/entities';
import * as bcrypt from 'bcrypt';
import * as argon2 from 'argon2';
import { ProfileService } from '../profile/profile.service';
import * as fs from 'fs';
import * as path from 'path';
import { DataSource } from 'typeorm';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private profileService: ProfileService,
    private dataSource: DataSource,
  ) {}

  async checkUserExistByPhone(phone: string): Promise<boolean> {
    try {
      const userByPhone = await this.userService.findUserByPhone(phone);

      if (userByPhone) {
        return true;
      }
      return false;
    } catch (ex) {
      Logger.error(ex);
      throw new AppError(
        HttpStatus.INTERNAL_SERVER_ERROR,
        ErrorCode.INTERNAL_SERVER_ERROR,
        `check user exists error: ${ex}`,
      );
    }
  }

  genPayload(id: string, phone: string) {
    return {
      id: id,
      phone: phone,
    };
  }

  async hashData(data: string) {
    return await bcrypt.hash(data, 10);
  }

  async register(
    registerDto: RegisterDto,
  ): Promise<RegisterResult | undefined> {
    const queryRunner = this.dataSource.createQueryRunner();
    try {
      const { phone, password, fullname } = { ...registerDto };

      const registerResult: RegisterResult = {
        is_success: false,
        user: null,
        error: null,
      };

      const user = await this.checkUserExistByPhone(phone);
      if (user) {
        throw new AppError(
          HttpStatus.BAD_REQUEST,
          ErrorCode.BAD_REQUEST,
          `Đăng ký: ${`Người dùng ${phone} đã tồn tại`}`,
        );
      }

      await queryRunner.connect();
      await queryRunner.startTransaction();

      const newUser = new User();
      newUser.password = await this.hashData(password);
      newUser.phone = phone;
      const addedUser = await await queryRunner.manager.save(newUser);

      const newProfile = new Profile();
      newProfile.avatar = fs.readFileSync(
        path.join(__dirname, '../../images/default-avatar.jpg'),
        'base64',
      );
      newProfile.fullname = fullname;
      newProfile.user_id = addedUser.id;
      const addedProfile = await queryRunner.manager.save(newProfile);

      await queryRunner.commitTransaction();

      return {
        ...registerResult,
        is_success: true,
        user: {
          id: addedUser.id,
        },
      };
    } catch (ex) {
      await queryRunner.rollbackTransaction();
      throw new AppError(
        HttpStatus.INTERNAL_SERVER_ERROR,
        ErrorCode.INTERNAL_SERVER_ERROR,
        `Đăng ký: ${ex}`,
      );
    } finally {
      // you need to release a queryRunner which was manually instantiated
      await queryRunner.release();
    }
  }
}
