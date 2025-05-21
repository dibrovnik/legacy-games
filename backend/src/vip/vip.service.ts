// src/services/vip.service.ts
import { Injectable, BadRequestException } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual } from 'typeorm';
import { User } from 'src/entities/user.entity';
import { VipSettings } from 'src/entities/vip-settings.entity';

@Injectable()
export class VipService {
  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(VipSettings) private settingsRepo: Repository<VipSettings>,
  ) {}

  /** Подписаться или продлить немедленно */
  async subscribe(userId: number): Promise<User> {
    const [user, settings] = await Promise.all([
      this.userRepo.findOneOrFail({ where: { id: userId } }),
      this.settingsRepo.findOneOrFail({ where: { id: 1 } }),
    ]);

    const now = new Date();
    // Если подписка ещё активна — просто возвращаем без снятия денег
    if (user.vip_expires_at && user.vip_expires_at > now) {
      return user;
    }

    // Проверяем баланс
    if (Number(user.balance_rub) < Number(settings.price_rub)) {
      throw new BadRequestException('Недостаточно средств для оплаты подписки');
    }

    // списываем
    user.balance_rub = Number(user.balance_rub) - Number(settings.price_rub);

    // устанавливаем новую дату окончания на now + duration
    const base = now;
    const newExpiry = new Date(base);
    newExpiry.setMonth(newExpiry.getMonth() + settings.duration_months);
    user.vip_expires_at = newExpiry;

    // включаем автопродление
    user.vip_auto_renew = true;

    return this.userRepo.save(user);
  }

  /** Отменить автопродление (сохраняется VIP до vip_expires_at) */
  async cancelAutoRenew(userId: number): Promise<User> {
    const user = await this.userRepo.findOneOrFail({ where: { id: userId } });
    user.vip_auto_renew = false;
    return this.userRepo.save(user);
  }

  /** Статус подписки */
  async getStatus(userId: number): Promise<{ active: boolean; expiresAt: Date | null }> {
    const user = await this.userRepo.findOneOrFail({ where: { id: userId } });
    const now = new Date();
    return {
      active: !!(user.vip_expires_at && user.vip_expires_at > now),
      expiresAt: user.vip_expires_at,
    };
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleAutoRenew() {
    const now = new Date();
    const users = await this.userRepo.find({
      where: {
        vip_auto_renew: true,
        vip_expires_at: LessThanOrEqual(now),
      },
    });
    for (const u of users) {
      try {
        await this.subscribe(u.id);
      } catch {
        // если не получилось списать — просто выключаем авто-продление
        u.vip_auto_renew = false;
        await this.userRepo.save(u);
      }
    }
  }
}
