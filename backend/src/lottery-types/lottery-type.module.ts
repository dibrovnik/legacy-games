import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LotteryTypesService } from './lottery-types.service';
import { LotteryTypesController } from './lottery-types.controller';
import { LotteryType } from 'src/entities/lottery-type.entity';
import { Lottery } from 'src/entities/lottery.entity';

@Module({
  imports: [TypeOrmModule.forFeature([LotteryType, Lottery])],
  providers: [LotteryTypesService],
  controllers: [LotteryTypesController],
  exports: [LotteryTypesService],
})
export class LotteryTypesModule {}
