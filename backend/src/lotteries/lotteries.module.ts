// src/lotteries/lotteries.module.ts
import { LotteryType } from 'src/entities/lottery-type.entity';
import { LotteriesController } from './lotteries.controller';
import { LotteriesService } from './lotteries.service';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Lottery } from 'src/entities/lottery.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Lottery, LotteryType])],
  providers: [LotteriesService, LotteriesService],
  controllers: [LotteriesController, LotteriesController],
  exports: [LotteriesService],
})
export class LotteriesModule {}
