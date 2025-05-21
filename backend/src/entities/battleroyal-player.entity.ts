// src/entities/battleroyal-player.entity.ts
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { BattleRoyal } from './battleroyal.entity';

@Entity('battle_royal_players')
export class BattleRoyalPlayer {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: number; // ID пользователя из вашей системы аутентификации

  @Column('simple-array', { nullable: true }) // Changed to simple-array to store multiple numbers
  selectedNumbers: number[]; // Массив чисел, выбранных игроком

  @Column({ default: false })
  hasTicket: boolean; // Подтверждает, что игрок купил билет

  @Column({ type: 'int', nullable: true })
  finalStageReached: number | null; // Фаза, на которой числа игрока были элиминированы (для выигрыша)

  @ManyToOne(() => BattleRoyal, (br) => br.players)
  battleRoyal: BattleRoyal;
}
