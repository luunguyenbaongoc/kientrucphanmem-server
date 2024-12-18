import { Injectable, HttpStatus } from '@nestjs/common';
import { ErrorCode } from 'src/utils/error-code';
import { InjectRepository } from '@nestjs/typeorm';
import { Profile } from 'src/entities';
import { Repository } from 'typeorm';
import { UpdateProfileDto } from './dto';
import { AppError } from 'src/utils/AppError';

@Injectable()
export class ProfileService {
  constructor(
    @InjectRepository(Profile)
    private profilesRepository: Repository<Profile>,
  ) {}

  async addProfile(profile: Profile): Promise<Profile | undefined> {
    const result = await this.profilesRepository.insert(profile);
    const newProfileId = result.identifiers[0]?.id;
    return await this.profilesRepository.findOneBy({
      user_id: profile.user_id,
      id: newProfileId,
    });
  }

  async updateProfile(updateProfileDto: UpdateProfileDto): Promise<Profile> {
    const { profileId, avatar, fullname } = updateProfileDto;

    const profile = await this.profilesRepository.findOne({
      where: { id: profileId },
    });

    if (!profile) {
      throw new AppError(
        HttpStatus.BAD_REQUEST,
        ErrorCode.BAD_REQUEST,
        `Không tìm thấy người dùng hoặc hồ sơ cập nhật`,
      );
    }

    profile.fullname = fullname;
    profile.avatar = avatar;
    return await this.profilesRepository.save(profile);
  }

  async findProfilesByUserId(userId: string): Promise<Profile[] | undefined> {
    return await this.profilesRepository.find({
      where: { user_id: userId },
    });
  }
}
