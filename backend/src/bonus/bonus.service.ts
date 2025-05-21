// src/services/bonus.service.ts
import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/entities/user.entity';
import { EntityManager, Repository } from 'typeorm';
import { BonusSettingsService } from './bonus-settings.service';

@Injectable()
export class BonusService {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    private readonly bs: BonusSettingsService,
  ) {}

  private async applyMultiplier(amount: number, isVip: boolean): Promise<number> {
    const s = await this.bs.find();
    const mul = isVip ? Number(s.vip_multiplier) : 1;
    return Math.floor(amount * mul);
  }

  /** Фиксированные бонусы */
  async awardFixed(
    userId: number,
    action: 'registration' | 'telegram_subscribe' | 'ticket_purchase',
  ) {
    const s = await this.bs.find();
    const raw = Number(s[action]);
    const user = await this.users.findOneOrFail({ where: { id: userId } });
    const bonus = await this.applyMultiplier(
      raw,
      !!user.vip_expires_at && user.vip_expires_at > new Date(),
    );
    user.balance_bonus = Number(user.balance_bonus) + bonus;
    await this.users.save(user);
    return bonus;
  }

  /** Фиксированный вычет бонусов (проверяет баланс и списывает) */
  async awardFixedAmount(userId: number, amount: number): Promise<any> {
    const user = await this.users.findOneOrFail({ where: { id: userId } });
    user.balance_bonus = Number(user.balance_bonus) + Number(amount);
    await this.users.save(user);
    return await this.users.save(user);
  }

  async awardFixedTx(
    manager: EntityManager,
    user: User,
    action: 'registration' | 'telegram_subscribe' | 'ticket_purchase',
  ): Promise<number> {
    const s = await this.bs.find();
    const raw = Number(s[action]);
    const isVip = user.vip_expires_at && user.vip_expires_at > new Date();
    const bonus = Math.floor(raw * (isVip ? Number(s.vip_multiplier) : 1));
    user.balance_bonus = Number(user.balance_bonus) + bonus;
    await manager.save(User, user);
    return bonus;
  }

  /** Плавающий бонус по ставке */
  async awardFloating(userId: number, stake: number, result: 'win' | 'loss') {
    const s = await this.bs.find();
    const mult = result === 'win' ? Number(s.win_multiplier) : Number(s.loss_multiplier);
    const base = Math.floor(stake * mult);
    const user = await this.users.findOneOrFail({ where: { id: userId } });
    const bonus = await this.applyMultiplier(
      base,
      !!user.vip_expires_at && user.vip_expires_at > new Date(),
    );
    user.balance_bonus = Number(user.balance_bonus) + bonus;
    await this.users.save(user);
    return bonus;
  }
  /** Фиксированный вычет бонусов (проверяет баланс и списывает) */
  async spendFixed(userId: number, amount: number): Promise<any> {
    console.log('spendFixed', userId);
    const user = await this.users.findOneOrFail({ where: { id: userId } });
    console.log('spendFixed', Number(user.balance_bonus), Number(amount));
    if (Number(user.balance_bonus) < Number(amount)) {
      throw new BadRequestException('Недостаточно бонусных средств');
    }
    user.balance_bonus = Number(user.balance_bonus) - Number(amount);
    await this.users.save(user);
    return await this.users.save(user);
  }

  /** Вычет бонусов внутри транзакции */
  async spendFixedTx(manager: EntityManager, user: User, amount: number): Promise<number> {
    if (user.balance_bonus < amount) {
      throw new BadRequestException('Недостаточно бонусных средств');
    }
    user.balance_bonus = Number(user.balance_bonus) - amount;
    await manager.save(User, user);
    return amount;
  }

  /** Плавающий вычет (на основе процента или любой логики) */
  async spendFloatingTx(
    manager: EntityManager,
    user: User,
    stake: number,
    result: 'win' | 'loss',
  ): Promise<number> {
    // по аналогии с awardFloatingTx, но вычитает:
    const s = await this.bs.find();
    const mult = result === 'win' ? Number(s.win_multiplier) : Number(s.loss_multiplier);
    const base = Math.floor(stake * mult);
    const isVip = user.vip_expires_at && user.vip_expires_at > new Date();
    const amount = Math.floor(base * (isVip ? Number(s.vip_multiplier) : 1));
    if (user.balance_bonus < amount) {
      throw new BadRequestException('Недостаточно бонусных средств');
    }
    user.balance_bonus = Number(user.balance_bonus) - amount;
    await manager.save(User, user);
    return amount;
  }
}
