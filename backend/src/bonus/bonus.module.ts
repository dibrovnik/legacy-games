// src/modules/bonus/bonus.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { BonusSettings } from 'src/entities/bonus-settings.entity';
import { User } from 'src/entities/user.entity';
import { BonusSettingsService } from './bonus-settings.service';
import { BonusService } from './bonus.service';
import { BonusController } from './bonus.controller';
import { BonusSettingsController } from './bonus-settings.controller';

@Module({
  imports: [
    // Репозитории для работы с настройками бонусов и пользователями
    TypeOrmModule.forFeature([BonusSettings, User]),
  ],
  providers: [BonusSettingsService, BonusService],
  controllers: [BonusSettingsController, BonusController],
  exports: [BonusService, BonusSettingsService],
})
export class BonusModule {}
