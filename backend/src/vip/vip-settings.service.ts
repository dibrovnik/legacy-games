// src/services/vip-settings.service.ts
import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { VipSettings } from 'src/entities/vip-settings.entity';
import { Repository } from 'typeorm';

@Injectable()
export class VipSettingsService implements OnModuleInit {
  private readonly logger = new Logger(VipSettingsService.name);
  constructor(
    @InjectRepository(VipSettings)
    private readonly repo: Repository<VipSettings>,
  ) {}

  async onModuleInit() {
    // создадим запись при старте, если её нет
    await this.ensureExists();
  }

  /** Гарантирует, что запись id=1 существует */
  private async ensureExists() {
    const exists = await this.repo.findOne({ where: { id: 1 } });
    if (!exists) {
      const defaults = this.repo.create({
        id: 1, // фиксируем ID, чтобы контроллеры его искали
        price_rub: 500.0, // ваша дефолтная цена
        duration_months: 1, // ваша дефолтная длительность
      });
      await this.repo.save(defaults);
      this.logger.log('VIP-settings seeded with defaults');
    }
  }

  /** Получить настройки (с сидингом на всякий случай) */
  async find(): Promise<VipSettings> {
    // если вдруг нет — породим
    await this.ensureExists();
    return this.repo.findOneOrFail({ where: { id: 1 } });
  }

  /** Обновить настройки */
  async update(price_rub: number, duration_months: number): Promise<VipSettings> {
    const settings = await this.find();
    settings.price_rub = price_rub;
    settings.duration_months = duration_months;
    return this.repo.save(settings);
  }
}
