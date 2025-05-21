import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { BattleRoyal } from 'src/entities/battleroyal.entity';
import { BattleRoyalDraw } from 'src/entities/battleroyal-draw.entity';
import { BattleRoyalPlayer } from 'src/entities/battleroyal-player.entity';

// import { BattleRoyalController } from './battleroyal.controller';
import { BattleRoyalService } from './battleroyal.service';
import { BattleRoyalGateway } from './battleroyal.gateway';
import { DrawSchedulerService } from './draw-scheduler.service';
import { ScheduleModule } from '@nestjs/schedule';
import { UsersModule } from 'src/users/users.module';
import { BonusModule } from 'src/bonus/bonus.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([BattleRoyal, BattleRoyalDraw, BattleRoyalPlayer]),
    ScheduleModule.forRoot(),
    UsersModule,
    BonusModule,
  ],
  controllers: [],
  providers: [BattleRoyalService, BattleRoyalGateway, DrawSchedulerService],
})
export class BattleroyalModule {}
