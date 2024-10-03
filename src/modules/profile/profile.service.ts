import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Profile } from 'src/entities';
import { Repository } from 'typeorm';

@Injectable()
export class ProfileService {
  constructor(
    @InjectRepository(Profile)
    private ProfilesRepository: Repository<Profile>,
  ) {}

  async addProfile(profile: Profile): Promise<Profile | undefined> {
    await this.ProfilesRepository.insert(profile);
    return await this.ProfilesRepository.findOneBy({
      user_id: profile.user_id,
    });
  }
}
