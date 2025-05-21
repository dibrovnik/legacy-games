// lottery.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany } from 'typeorm';
import { ObjectType, Field, ID, Int } from '@nestjs/graphql';
import { LotteryType } from './lottery-type.entity';
import { Draw } from './draw.entity';

@ObjectType()
@Entity('lotteries')
export class Lottery {
  @Field(() => ID)
  @PrimaryGeneratedColumn()
  id: number;

  @Field(() => LotteryType)
  @ManyToOne(() => LotteryType, (type) => type.lotteries, { eager: true })
  type: LotteryType;

  @Field()
  @Column()
  name: string;

  @Field({ nullable: true })
  @Column({ nullable: true, type: 'text' })
  description?: string;

  @Field(() => Int)
  @Column('int')
  numbersTotal: number;

  @Field(() => Int)
  @Column('int')
  numbersDrawn: number;

  /** Базовая цена билета для этой лотереи */
  @Field()
  @Column('decimal', { precision: 10, scale: 2, default: 1 })
  basePrice: number;

  @Field(() => [Draw], { nullable: true })
  @OneToMany(() => Draw, (draw) => draw.lottery)
  draws?: Draw[];

  @Field({ nullable: true, description: 'Является ли билет сувенирным' })
  @Column('bool', { nullable: true })
  isSouvenir?: boolean;

  @Field({ nullable: true, description: 'Код сувенирного города' })
  @Column({ type: 'varchar', length: 100, nullable: true })
  souvenirCityCode?: string;

  @Field({ nullable: true, description: 'URL картинки билета' })
  @Column({ type: 'varchar', length: 500, nullable: true })
  imageUrl?: string;
}
