// lottery-type.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { ObjectType, Field, ID } from '@nestjs/graphql';
import { Lottery } from './lottery.entity';

@ObjectType()
@Entity('lottery_types')
export class LotteryType {
  @Field(() => ID)
  @PrimaryGeneratedColumn()
  id: number;

  @Field()
  @Column({ unique: true })
  name: string;

  @Field({ nullable: true })
  @Column({ nullable: true, type: 'text' })
  description?: string;

  @Field(() => [Lottery], { nullable: true })
  @OneToMany(() => Lottery, (lotto) => lotto.type)
  lotteries?: Lottery[];
}
