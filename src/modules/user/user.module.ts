import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/entities';
import { ProfileModule } from '../profile/profile.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]), 
    ProfileModule
  ],
  exports: [UserService],
  controllers: [UserController],
  providers: [UserService],
})
export class UserModule {}
