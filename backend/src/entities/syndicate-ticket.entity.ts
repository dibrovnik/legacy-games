// src/syndicates/syndicate-ticket.entity.ts
import { Entity, PrimaryGeneratedColumn, ManyToOne } from 'typeorm';
import { Syndicate } from './syndicate.entity';
import { SyndicateMember } from './syndicate-member.entity';
import { Ticket } from './ticket.entity';

@Entity('syndicate_tickets')
export class SyndicateTicket {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Syndicate, (s) => s.tickets)
  syndicate: Syndicate;

  @ManyToOne(() => SyndicateMember, (m) => m.syndicate)
  member: SyndicateMember;

  @ManyToOne(() => Ticket, { eager: true })
  ticket: Ticket;
}
