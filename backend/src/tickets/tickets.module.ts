import { TicketsController } from './tickets.controller';
import { TicketsService } from './tickets.service';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BonusModule } from 'src/bonus/bonus.module';
import { Draw } from 'src/entities/draw.entity';
import { Ticket } from 'src/entities/ticket.entity';
import { User } from 'src/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Ticket, Draw, User]), BonusModule],
  providers: [TicketsService, TicketsService],
  controllers: [TicketsController],
  exports: [TicketsService],
})
export class TicketsModule {}
