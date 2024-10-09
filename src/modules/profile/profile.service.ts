import { 
  Injectable, 
  HttpStatus
} from '@nestjs/common';
import { ErrorCode } from 'src/utils/error-code';
import { InjectRepository } from '@nestjs/typeorm';
import { Profile } from 'src/entities';
import { Repository } from 'typeorm';
import { UpdateProfileDto } from '../user/dto';
import { AppError } from 'src/utils/AppError';

@Injectable()
export class ProfileService {
  constructor(
    @InjectRepository(Profile)
    private profilesRepository: Repository<Profile>,
  ) {}

  async addProfile(profile: Profile): Promise<Profile | undefined> {
    await this.profilesRepository.insert(profile);
    return await this.profilesRepository.findOneBy({
      user_id: profile.user_id,
    });
  }

  async updateProfile(
    profileId: string, 
    updateProfileDto: UpdateProfileDto
  ): Promise<Profile> {
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

    profile.fullname = updateProfileDto.fullname || profile.fullname;
    profile.avatar = updateProfileDto.avatar || profile.avatar;
    return this.profilesRepository.save(profile);
  }

  async findProfilesByUserId(userId: string): Promise<Profile[] | undefined> {
    return await this.profilesRepository.find({
      where: { user_id: userId },
    });
  }
}
