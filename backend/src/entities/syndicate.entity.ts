// src/syndicates/syndicate.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Draw } from './draw.entity';
import { SyndicateMember } from './syndicate-member.entity';
import { SyndicateTicket } from './syndicate-ticket.entity';

export enum SyndicateStatus {
  PENDING = 'PENDING', // только создано, ждет участников
  WAITING_FOR_READY = 'WAITING_FOR_READY', // все пришли, ждем готовности
  BUYING = 'BUYING', // идет покупка билетов
  PARTICIPATING = 'PARTICIPATING', // синдикат участвует в розыгрыше
  FAILED = 'FAILED', // кто-то не купил, билеты играют одиночно
  COMPLETED = 'COMPLETED', // тираж завершен и награды распределены
}

@Entity('syndicates')
export class Syndicate {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, { eager: true })
  host: User;

  @ManyToOne(() => Draw, { eager: true })
  draw: Draw;

  @Column('int')
  maxMembers: number;

  @Column({ type: 'enum', enum: SyndicateStatus, default: SyndicateStatus.PENDING })
  status: SyndicateStatus;

  @CreateDateColumn()
  createdAt: Date;

  @OneToMany(() => SyndicateMember, (m) => m.syndicate)
  members: SyndicateMember[];

  @OneToMany(() => SyndicateTicket, (t) => t.syndicate)
  tickets: SyndicateTicket[];
}
