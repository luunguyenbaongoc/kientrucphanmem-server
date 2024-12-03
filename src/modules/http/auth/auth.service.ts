import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { UserService } from '../user/user.service';
import { AppError } from 'src/utils/AppError';
import { ErrorCode } from 'src/utils/error-code';
import { LoginResult, RegisterResult, Token } from './types';
import { Profile, User } from 'src/entities';
import * as bcrypt from 'bcrypt';
import * as argon2 from 'argon2';
import { ProfileService } from '../profile/profile.service';
import * as fs from 'fs';
import * as path from 'path';
import { DataSource } from 'typeorm';
import {
  LogInDto,
  RevokeRefreshDto,
  RefreshDto,
  RegisterDto,
  ResetPasswordDto,
} from './dto';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private profileService: ProfileService,
    private dataSource: DataSource,
    private jwtService: JwtService,
  ) {}

  private readonly logger = new Logger(AuthService.name);

  async checkUserExistByPhone(phone: string): Promise<boolean> {
    try {
      const userByPhone = await this.userService.findByPhone(phone);

      if (userByPhone) {
        return true;
      }
      return false;
    } catch (ex) {
      Logger.error(ex);
      throw new AppError(
        HttpStatus.INTERNAL_SERVER_ERROR,
        ErrorCode.INTERNAL_SERVER_ERROR,
        `${ex}`,
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
    await queryRunner.connect();
    await queryRunner.startTransaction();
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
          `${`Người dùng ${phone} đã tồn tại`}`,
        );
      }

      const newUser = new User();
      newUser.password = await this.hashData(password);
      newUser.phone = phone;
      newUser.created_date = new Date();
      newUser.active = true;
      const addedUser = await queryRunner.manager.save(newUser);

      const newProfile = new Profile();
      newProfile.avatar = fs.readFileSync(
        path.join(__dirname, '../../../images/default-avatar.jpg'),
        'base64',
      );
      newProfile.fullname = fullname;
      newProfile.user_id = addedUser.id;
      await queryRunner.manager.save(newProfile);

      await queryRunner.commitTransaction();

      return await this.logIn({ phone: phone, password: password });
    } catch (ex) {
      Logger.error(ex);
      await queryRunner.rollbackTransaction();
      throw ex;
    } finally {
      // you need to release a queryRunner which was manually instantiated
      await queryRunner.release();
    }
  }

  async getAccessToken(payload: any) {
    return await this.jwtService.signAsync(payload, {
      secret: process.env.ACCESS_TOKEN_SECRET,
      expiresIn: process.env.ACCESS_TOKEN_EXPIRATION_TIME,
    });
  }

  async getRefreshToken(payload: any) {
    return await this.jwtService.signAsync(payload, {
      secret: process.env.REFRESH_TOKEN_SECRET,
      expiresIn: process.env.REFRESH_TOKEN_EXPIRATION_TIME,
    });
  }

  async getTokens(id: string, phone: string) {
    const payload: any = this.genPayload(id, phone);

    const [access_token, refresh_token] = await Promise.all([
      this.getAccessToken(payload),
      this.getRefreshToken(payload),
    ]);

    return { access_token, refresh_token };
  }

  async logIn(loginDto: LogInDto): Promise<LoginResult | undefined> {
    try {
      const { phone, password } = { ...loginDto };

      const user = await this.userService.findByPhoneAndCheckExist(phone);

      const loginResult: LoginResult = {
        is_success: false,
        access_token: null,
        refresh_token: null,
        user: user
          ? {
              id: user.id,
            }
          : null,
        error: null,
      };

      if (!(await bcrypt.compare(password, user.password))) {
        throw new AppError(
          HttpStatus.BAD_REQUEST,
          ErrorCode.BAD_REQUEST,
          `Sai mật khẩu`,
        );
      }

      if (!user.active) {
        throw new AppError(
          HttpStatus.BAD_REQUEST,
          ErrorCode.BAD_REQUEST,
          `Tài khoản đã bị khóa. Vui lòng liên hệ quản trị viên để mở khóa.`,
        );
      }

      const token: Token = await this.getTokens(user.id, user.phone);

      await this.userService.addRefreshToken(
        user.id,
        await argon2.hash(token.refresh_token),
      );

      this.logger.log(
        `Người dùng ${phone} đã đăng nhập vào hệ thống vào lúc ${new Date()}`,
      );

      return {
        ...loginResult,
        is_success: true,
        ...token,
      };
    } catch (ex) {
      Logger.error(ex);
      throw ex;
    }
  }

  async resetPassword(
    resetPasswordDto: ResetPasswordDto,
  ): Promise<LoginResult | undefined> {
    try {
      const { phone, new_password } = { ...resetPasswordDto };
      const userByPhone = await this.userService.findByPhoneAndCheckExist(
        phone,
      );

      userByPhone.password = await this.hashData(new_password);
      await this.userService.saveUser(userByPhone);

      return await this.logIn({ phone: phone, password: new_password });
    } catch (ex) {
      Logger.error(ex);
      throw ex;
    }
  }

  async getHashedRefreshTokenFromList(
    refreshToken: string,
    userRefreshTokenList: string[],
  ): Promise<string> {
    let hashedRefreshToken: string = null;
    for (const i in userRefreshTokenList) {
      if (await argon2.verify(userRefreshTokenList[i], refreshToken)) {
        hashedRefreshToken = userRefreshTokenList[i];
        break;
      }
    }
    return hashedRefreshToken;
  }

  async logout(id: string, refreshToken: string): Promise<boolean> {
    try {
      const user = await this.userService.findByIdAndCheckExist(id);

      const selectedRefreshToken = await this.getHashedRefreshTokenFromList(
        refreshToken,
        user.refresh_token_list,
      );

      this.logger.log(
        `Người dùng ${
          user.phone
        } đã đăng xuất khỏi hệ thống vào lúc ${new Date()}`,
      );

      await this.userService.removeRefreshToken(
        user.id,
        user.refresh_token_list,
        selectedRefreshToken,
      );
    } catch (ex) {
      Logger.error(ex);
      throw ex;
    }

    return true;
  }

  async refresh(refreshDto: RefreshDto): Promise<Token | undefined> {
    try {
      const { id, is_new_refresh_token, refresh_token } = { ...refreshDto };
      const user = await this.userService.findByIdAndCheckExist(id);

      let token: Token = {
        access_token: null,
        refresh_token: refresh_token,
      };

      if (!user.active) {
        throw new AppError(
          HttpStatus.BAD_REQUEST,
          ErrorCode.BAD_REQUEST,
          `Tài khoản đã bị khóa. Vui lòng liên hệ quản trị viên để mở khóa.`,
        );
      }

      const oldHashedRefreshToken = await this.getHashedRefreshTokenFromList(
        token.refresh_token,
        user.refresh_token_list,
      );
      if (!oldHashedRefreshToken) {
        return null;
      }

      if (is_new_refresh_token) {
        token = await this.getTokens(user.id, user.phone);
        await this.userService.removeRefreshToken(
          user.id,
          user.refresh_token_list,
          oldHashedRefreshToken,
        );
        await this.userService.addRefreshToken(
          user.id,
          await argon2.hash(token.refresh_token),
        );
      } else {
        const access_token = await this.getAccessToken(
          this.genPayload(user.id, user.phone),
        );
        token.access_token = access_token;
      }

      return token;
    } catch (ex) {
      Logger.error(ex);
      throw ex;
    }
  }

  async revokeRefreshToken(
    revokeRefreshDto: RevokeRefreshDto,
  ): Promise<boolean> {
    try {
      const { id, refresh_token } = { ...revokeRefreshDto };
      const user = await this.userService.findByIdAndCheckExist(id);

      const oldHashedRefreshToken = await this.getHashedRefreshTokenFromList(
        refresh_token,
        user.refresh_token_list,
      );
      if (!oldHashedRefreshToken) {
        return true;
      }

      await this.userService.removeRefreshToken(
        user.id,
        user.refresh_token_list,
        oldHashedRefreshToken,
      );

      return true;
    } catch (ex) {
      Logger.error(ex);
      throw ex;
    }
  }
}
