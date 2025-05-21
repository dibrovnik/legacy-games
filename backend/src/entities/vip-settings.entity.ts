// src/entities/vip-settings.entity.ts
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('vip_settings')
export class VipSettings {
  @PrimaryGeneratedColumn()
  id: number;

  /** Стоимость подписки в рублях */
  @Column('decimal', { precision: 14, scale: 2, default: 0 })
  price_rub: number;

  /** Длительность подписки в месяцах */
  @Column('int', { default: 1 })
  duration_months: number;
}
