import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SyndicatesService } from './syndicates.service';
import { Syndicate } from 'src/entities/syndicate.entity';
import { SyndicateMember } from 'src/entities/syndicate-member.entity';
import { SyndicateTicket } from 'src/entities/syndicate-ticket.entity';
import { Ticket } from 'src/entities/ticket.entity';
import { User } from 'src/entities/user.entity';
import { Notification } from 'src/entities/notification';
import { DrawsModule } from 'src/draws/draws.module';
import { SyndicatesController } from './syndicates.controller';
import { TicketsModule } from 'src/tickets/tickets.module';
import { SyndicatesGateway } from './syndicates.gateway';
import { SyndicateSubscriber } from './syndicate.subscriber';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Syndicate,
      SyndicateMember,
      SyndicateTicket,
      Ticket,
      User,
      Notification,
    ]),
    forwardRef(() => DrawsModule),
    forwardRef(() => TicketsModule),
  ],
  providers: [SyndicatesService, SyndicatesGateway, SyndicateSubscriber],
  controllers: [SyndicatesController],
  exports: [SyndicatesService],
})
export class SyndicatesModule {}
