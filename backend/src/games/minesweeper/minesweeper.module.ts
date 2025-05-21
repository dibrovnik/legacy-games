import { Module } from '@nestjs/common';
import { MinesweeperGateway } from './minesweeper.gateway';
import { MinesweeperService } from './minesweeper.service';
import { BonusModule } from 'src/bonus/bonus.module';

@Module({
  imports: [BonusModule],
  providers: [MinesweeperGateway, MinesweeperService],
})
export class MinesweeperModule {}
