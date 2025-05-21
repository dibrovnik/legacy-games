// src/tickets/entities/ticket.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { ObjectType, Field, ID, Int, Float } from '@nestjs/graphql';
import { Draw } from './draw.entity';
import { User } from './user.entity';
@ObjectType()
@Entity('tickets')
export class Ticket {
  @Field(() => ID)
  @PrimaryGeneratedColumn()
  id: number;

  @Field(() => Draw)
  @ManyToOne(() => Draw, (draw) => draw.tickets, { eager: true })
  draw: Draw;

  @Field(() => User)
  @ManyToOne(() => User, (user) => user.tickets, { eager: true })
  user: User;

  @Field(() => [Int])
  @Column({ type: 'simple-json' })
  selectedNumbers: number[];

  @Field(() => Float, { description: 'Цена билета на момент покупки' })
  @Column('decimal', { precision: 10, scale: 2 })
  price: number;

  @Field(() => Int, { description: 'Количество совпавших чисел', defaultValue: 0 })
  @Column('int', { default: 0 })
  matchedCount: number;

  @Field(() => Float, { description: 'Сумма выигрыша для билета', defaultValue: 0 })
  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  prize: number;

  @Field({ description: 'Флаг, выигрышный ли билет' })
  @Column('bool', { default: false })
  isWinning: boolean;

  @Field(() => String)
  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;
}
