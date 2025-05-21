// src/friends/friend.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  Unique,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';
import { FriendStatus } from 'src/friends/friend-status.enum';

@Entity('friends')
@Unique(['requester', 'recipient'])
export class Friend {
  @PrimaryGeneratedColumn()
  id: number;

  // тот, кто отправил запрос
  @ManyToOne(() => User, (u) => u.sentFriendRequests, { eager: true })
  @JoinColumn({ name: 'requester_id' })
  requester: User;

  // тот, кому отправлен запрос
  @ManyToOne(() => User, (u) => u.receivedFriendRequests, { eager: true })
  @JoinColumn({ name: 'recipient_id' })
  recipient: User;

  @Column({ type: 'enum', enum: FriendStatus, default: FriendStatus.PENDING })
  status: FriendStatus;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
