import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DrawsService } from './draws.service';
import { DrawsController } from './draws.controller';
import { Draw } from 'src/entities/draw.entity';
import { Lottery } from 'src/entities/lottery.entity';
import { User } from 'src/entities/user.entity';
import { Ticket } from 'src/entities/ticket.entity';
import { Syndicate } from 'src/entities/syndicate.entity';
import { SyndicateTicket } from 'src/entities/syndicate-ticket.entity';
import { SyndicateMember } from 'src/entities/syndicate-member.entity';
import { BonusModule } from 'src/bonus/bonus.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Draw,
      Lottery,
      Ticket,
      User,
      Syndicate,
      SyndicateTicket,
      SyndicateMember,
    ]),
    BonusModule,
  ],
  providers: [DrawsService],
  controllers: [DrawsController],
  exports: [DrawsService],
})
export class DrawsModule {}
