import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Profile, User } from 'src/entities';
import { AppError } from 'src/utils/AppError';
import { ErrorCode } from 'src/utils/error-code';
import { Repository } from 'typeorm';
import { UpdateProfileDto } from './dto';
import { ProfileService } from '../profile/profile.service';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private profileService: ProfileService,
  ) {}

  async findByPhone(phone: string): Promise<User | undefined> {
    return await this.userRepository.findOneBy({ phone });
  }

  async findByPhoneAndCheckExist(phone: string): Promise<User | undefined> {
    const userByPhone = await this.findByPhone(phone);
    if (!userByPhone) {
      throw new AppError(
        HttpStatus.BAD_REQUEST,
        ErrorCode.BAD_REQUEST,
        `Người dùng số điện thoại ${phone} không tồn tại`,
      );
    }
    return userByPhone;
  }

  async addUser(user: User): Promise<User | undefined> {
    await this.userRepository.insert(user);
    return await this.userRepository.findOneBy({ phone: user.phone });
  }

  async addRefreshToken(id: string, refreshToken: string): Promise<void> {
    const user = await this.findByIdAndCheckExist(id);

    user.refresh_token_list.push(refreshToken);
    await this.userRepository.save(user);
  }

  async saveUser(user: User): Promise<User | undefined> {
    await this.userRepository.save(user);
    return await this.userRepository.findOneBy({ id: user.id });
  }

  async findById(id: string): Promise<User | undefined> {
    return await this.userRepository.findOneBy({ id });
  }

  async findByIdAndCheckExist(id: string): Promise<User | undefined> {
    const userById = await this.findById(id);
    if (!userById) {
      throw new AppError(
        HttpStatus.BAD_REQUEST,
        ErrorCode.BAD_REQUEST,
        `Người dùng id ${id} không tồn tại`,
      );
    }
    return userById;
  }

  async removeRefreshToken(
    id: string,
    refreshTokenList: string[],
    refreshToken: string,
  ): Promise<void> {
    const user = await this.findByIdAndCheckExist(id);

    refreshTokenList = refreshTokenList.filter((o) => o !== refreshToken);
    user.refresh_token_list = [...refreshTokenList];
    await this.userRepository.save(user);
  }

  async createUserProfile(
    userId: string,
    updateProfileDto: UpdateProfileDto,
  ): Promise<Profile> {
    const user = await this.findByIdAndCheckExist(userId);
    const newProfile = new Profile();
    newProfile.fullname = updateProfileDto.fullname;
    newProfile.user_id = userId;
    newProfile.user = user;
    const profile = await this.profileService.addProfile(newProfile);
    return profile;
  }

  async updateUserProfile(
    profileId: string,
    updateProfileDto: UpdateProfileDto,
  ): Promise<Profile> {
    return this.profileService.updateProfile(profileId, updateProfileDto);
  }

  async getUserProfiles(userId: string): Promise<Profile[]> {
    await this.findByIdAndCheckExist(userId);
    return this.profileService.findProfilesByUserId(userId);
  }

  async uploadProfilePicture(
    filepath: string,
    profileId: string,
  ): Promise<string> {
    await this.profileService.updateProfile(profileId, {
      avatar: filepath,
    } as UpdateProfileDto);
    return `File uploaded successfully: ${filepath}`;
  }
}
