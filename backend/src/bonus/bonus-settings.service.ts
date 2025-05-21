// src/services/bonus-settings.service.ts
import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { BonusSettings } from 'src/entities/bonus-settings.entity';
import { Repository } from 'typeorm';

@Injectable()
export class BonusSettingsService implements OnModuleInit {
  private readonly logger = new Logger(BonusSettingsService.name);

  constructor(
    @InjectRepository(BonusSettings)
    private readonly repo: Repository<BonusSettings>,
  ) {}

  async onModuleInit() {
    // при старте засеем дефолты, если таблица пуста
    await this.ensureDefaults();
  }

  private async ensureDefaults() {
    const count = await this.repo.count();
    if (count === 0) {
      const def = this.repo.create({
        // здесь можно явно указать любые дефолтные значения,
        // либо полагаться на значения колонок по умолчанию
      });
      await this.repo.save(def);
      this.logger.log('BonusSettings seeded with defaults');
    }
  }

  /**
   * Возвращает единственную запись, а если её нет —
   * автоматически создаёт дефолтную и возвращает её.
   */
  async find(): Promise<BonusSettings> {
    let items = await this.repo.find({ take: 1 });
    if (items.length === 0) {
      await this.ensureDefaults();
      items = await this.repo.find({ take: 1 });
    }
    // гарантированно items[0] теперь существует
    return items[0];
  }

  /**
   * Частичное обновление: сохраняет только те поля, что передали в dto
   */
  async update(dto: Partial<BonusSettings>): Promise<BonusSettings> {
    const settings = await this.find();
    Object.assign(settings, dto);
    return this.repo.save(settings);
  }
}
