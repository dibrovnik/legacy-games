// src/entities/bonus-settings.entity.ts
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('bonus_settings')
export class BonusSettings {
  @PrimaryGeneratedColumn()
  id: number;

  /** Фикс. бонус за регистрацию (вирту. ед.) */
  @Column('decimal', { precision: 14, scale: 2, default: 100 })
  registration: number;

  /** Фикс. бонус за подписку в Telegram */
  @Column('decimal', { precision: 14, scale: 2, default: 50 })
  telegram_subscribe: number;

  /** Фикс. бонус за покупку билета */
  @Column('decimal', { precision: 14, scale: 2, default: 10 })
  ticket_purchase: number;

  /** Множитель ставки для плавающего бонуса при проигрыше (доля от ставки) */
  @Column('decimal', { precision: 5, scale: 4, default: 0.1 })
  loss_multiplier: number; // 10%

  /** Множитель ставки для плавающего бонуса при выигрыше */
  @Column('decimal', { precision: 5, scale: 4, default: 0.3 })
  win_multiplier: number; // 30%

  /** VIP-множитель для всех бонусов */
  @Column('decimal', { precision: 5, scale: 2, default: 2.0 })
  vip_multiplier: number; // x2
}
