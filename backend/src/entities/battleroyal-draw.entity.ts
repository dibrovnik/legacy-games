// src/entities/battleroyal-draw.entity.ts
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { BattleRoyal } from './battleroyal.entity';

@Entity('battle_royal_draws')
export class BattleRoyalDraw {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ default: 10 })
  gridSize: number; // Размер сетки (например, 10 для 10x10 = 100 чисел)

  @Column({ default: 10000 }) // 10 seconds
  roundTimeMs: number; // Время в миллисекундах на каждый раунд

  @Column('simple-array', { nullable: false }) // Array of percentages to keep, e.g., [0.5, 0.3, 0.4, 0.8]
  removalPhases: number[];

  @Column({ type: 'timestamp' })
  startsAt: Date; // Когда должен начаться этот тираж

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @OneToMany(() => BattleRoyal, (br) => br.draw)
  battleRoyals: BattleRoyal[];
}
