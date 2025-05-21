import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  BeforeInsert,
  BeforeUpdate,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import * as bcrypt from 'bcrypt';
import { ObjectType, Field, ID, Float } from '@nestjs/graphql';
import { Role } from './role.entity';
import { Notification } from './notification';
import { Friend } from './friend.entity';
import { Ticket } from './ticket.entity';

@ObjectType()
@Entity('users')
export class User {
  @Field(() => ID)
  @PrimaryGeneratedColumn()
  id: number;

  @Field(() => String, { nullable: true })
  @Column({ nullable: false })
  first_name: string;

  @Field(() => String, { nullable: true })
  @Column({ nullable: false })
  last_name: string;

  @Field(() => String, { nullable: true })
  @Column({ nullable: true })
  avatar: string;

  @Field(() => String, { nullable: true })
  @Column({ unique: true, nullable: true })
  phone: string;

  @Field(() => String, { nullable: true })
  @Column({ unique: true, nullable: true })
  email: string;

  @Field(() => String, { nullable: true })
  @Column({ type: 'timestamp', nullable: true })
  phone_verified_at: Date | null;

  @Field(() => String, { nullable: true })
  @Column({ type: 'timestamp', nullable: true })
  email_verified_at: Date | null;

  @Column()
  password_hash: string;

  @Field(() => Float, { nullable: true })
  @Column('decimal', { precision: 14, scale: 2, default: 0 })
  balance_rub: number;

  @Field(() => Float, { nullable: true })
  @Column('decimal', { precision: 14, scale: 2, default: 0 })
  balance_bonus: number;

  @Field(() => Role, { nullable: true })
  @ManyToOne(() => Role, { eager: true, nullable: true })
  role: Role | null;

  @Field(() => [Notification], { nullable: true })
  @OneToMany(() => Notification, (notification) => notification.user, { nullable: true })
  notifications: Notification[];

  @BeforeInsert()
  @BeforeUpdate()
  async hashPassword() {
    if (this.password_hash && !this.password_hash.startsWith('$2b$')) {
      this.password_hash = await bcrypt.hash(this.password_hash, 10);
    }
  }

  @OneToMany(() => Friend, (f) => f.requester)
  sentFriendRequests: Friend[];

  @OneToMany(() => Friend, (f) => f.recipient)
  receivedFriendRequests: Friend[];

  @OneToMany(() => Ticket, (ticket) => ticket.user)
  tickets: Ticket[];

  /** До какого момента пользователь VIP (или null) */
  @Column({ type: 'timestamp', nullable: true })
  vip_expires_at: Date | null;

  /** Флаг авто-продления подписки */
  @Column({ type: 'boolean', default: false })
  vip_auto_renew: boolean;
}
