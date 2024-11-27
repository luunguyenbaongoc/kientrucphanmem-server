import { Module } from '@nestjs/common';
import { ProfileController } from './profile.controller';
import { ProfileService } from './profile.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Profile } from 'src/entities';

@Module({
  imports: [TypeOrmModule.forFeature([Profile])],
  exports: [ProfileService],
  controllers: [ProfileController],
  providers: [ProfileService],
})
export class ProfileModule {}
