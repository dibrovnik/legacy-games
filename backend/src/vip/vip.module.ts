import { ScheduleModule } from '@nestjs/schedule';
import { VipController } from './vip.controller';
import { VipService } from './vip.service';
import { Module } from '@nestjs/common';
import { User } from 'src/entities/user.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VipSettingsController } from './vip-settings.controller';
import { VipSettingsService } from './vip-settings.service';
import { VipSettings } from 'src/entities/vip-settings.entity';

@Module({
  imports: [ScheduleModule.forRoot(), TypeOrmModule.forFeature([User, VipSettings])],
  controllers: [VipController, VipSettingsController],
  providers: [VipService, VipSettingsService],
})
export class VipModule {}
