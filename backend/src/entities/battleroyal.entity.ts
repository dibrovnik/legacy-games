// src/entities/battleroyal.entity.ts
import { Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { BattleRoyalDraw } from './battleroyal-draw.entity';
import { BattleRoyalPlayer } from './battleroyal-player.entity';

@Entity('battle_royals')
export class BattleRoyal {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => BattleRoyalDraw, (draw) => draw.battleRoyals)
  draw: BattleRoyalDraw;

  @OneToMany(() => BattleRoyalPlayer, (player) => player.battleRoyal)
  players: BattleRoyalPlayer[];

  @Column({ default: 0 })
  currentPhase: number;

  @Column('simple-array', { nullable: true })
  eliminatedNumbers: number[];

  @Column({ type: 'int', default: 0 })
  timeLeft: number; // Время, оставшееся до конца текущей фазы

  @Column({ default: false })
  isGameOver: boolean;

  @Column({ default: false })
  isGameActive: boolean; // Indicates if game is actively running rounds

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0.0 })
  totalBank: number; // Общий банк игры

  @Column('jsonb', { nullable: true }) // Store winning info as JSONB
  winningInfo: { userId: number | null; amount: number; percentage: number } | null;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;
}
