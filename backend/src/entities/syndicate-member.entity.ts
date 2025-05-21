// src/syndicates/syndicate-member.entity.ts
import { Entity, PrimaryGeneratedColumn, ManyToOne, Column, CreateDateColumn } from 'typeorm';
import { Syndicate } from './syndicate.entity';
import { User } from './user.entity';

export enum MemberStatus {
  JOINED = 'JOINED',
  READY = 'READY',
}

@Entity('syndicate_members')
export class SyndicateMember {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Syndicate, (s) => s.members)
  syndicate: Syndicate;

  @ManyToOne(() => User, { eager: true })
  user: User;

  @Column({ type: 'enum', enum: MemberStatus, default: MemberStatus.JOINED })
  status: MemberStatus;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  amountSpent: number;

  @CreateDateColumn()
  joinedAt: Date;
}
