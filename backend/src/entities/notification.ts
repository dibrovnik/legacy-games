import { Field, ID, ObjectType, registerEnumType } from '@nestjs/graphql';
import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { User } from './user.entity';

export enum NotificationType {
  Default = 'Default',
  Primary = 'Primary',
  Secondary = 'Secondary',
  Success = 'Success',
  Warning = 'Warning',
  Danger = 'Danger',
}

registerEnumType(NotificationType, {
  name: 'NotificationType',
});

@ObjectType()
@Entity('notifications')
export class Notification {
  @Field(() => ID)
  @PrimaryGeneratedColumn()
  id: number;

  @Field(() => String)
  @Column({ nullable: false })
  message: string;

  @Field(() => NotificationType)
  @Column({ type: 'enum', enum: NotificationType, default: NotificationType.Default })
  type: NotificationType;

  @Field(() => User)
  @ManyToOne(() => User, (user) => user.notifications, { nullable: false, onDelete: 'CASCADE' })
  user: User;

  @Field(() => Date)
  @CreateDateColumn()
  createdAt: Date;
}
