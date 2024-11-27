import { Module } from '@nestjs/common';
import { GroupStatusController } from './group_status.controller';
import { GroupStatusService } from './group_status.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GroupStatus } from 'src/entities/group_status.entity';

@Module({
  imports: [TypeOrmModule.forFeature([GroupStatus])],
  controllers: [GroupStatusController],
  providers: [GroupStatusService],
  exports: [GroupStatusService],
})
export class GroupStatusModule {}
