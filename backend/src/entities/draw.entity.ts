// draw.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany } from 'typeorm';
import { ObjectType, Field, ID } from '@nestjs/graphql';
import { Lottery } from './lottery.entity';
import { Ticket } from './ticket.entity';

@ObjectType()
@Entity('draws')
export class Draw {
  @Field(() => ID)
  @PrimaryGeneratedColumn()
  id: number;

  @Field(() => Lottery)
  @ManyToOne(() => Lottery, (lotto) => lotto.draws, { eager: true })
  lottery: Lottery;

  @Field(() => [Number], { nullable: true })
  @Column({ type: 'simple-json', nullable: true })
  winningNumbers?: number[];

  @Field()
  @Column('timestamp')
  drawTimeFrom: Date;

  @Field()
  @Column('timestamp')
  drawTimeTo: Date;

  @Field(() => [Ticket], { nullable: true })
  @OneToMany(() => Ticket, (ticket) => ticket.draw)
  tickets?: Ticket[];

  @Field()
  @Column({ type: 'boolean', default: false })
  isCompleted: boolean;
}
