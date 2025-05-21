import { HttpException, Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { CreateDrawDto } from './dto/create-draw.dto';
import { UpdateDrawDto } from './dto/update-draw.dto';
import { Draw } from 'src/entities/draw.entity';
import { Lottery } from 'src/entities/lottery.entity';
import { Ticket } from 'src/entities/ticket.entity';
import { User } from 'src/entities/user.entity';
import { Syndicate, SyndicateStatus } from 'src/entities/syndicate.entity';
import { SyndicateTicket } from 'src/entities/syndicate-ticket.entity';
import { SyndicateMember } from 'src/entities/syndicate-member.entity';
import { BonusService } from 'src/bonus/bonus.service';

@Injectable()
export class DrawsService implements OnModuleInit {
  constructor(
    @InjectRepository(Draw)
    private readonly drawRepo: Repository<Draw>,
    @InjectRepository(Lottery)
    private readonly lotteryRepo: Repository<Lottery>,
    @InjectRepository(Ticket)
    private readonly ticketRepo: Repository<Ticket>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,

    @InjectRepository(Syndicate) private readonly syndRepo: Repository<Syndicate>,
    @InjectRepository(SyndicateTicket) private readonly stRepo: Repository<SyndicateTicket>,
    @InjectRepository(SyndicateMember) private readonly memberRepo: Repository<SyndicateMember>,
    private readonly bonusService: BonusService,
  ) {}

  /** Сидинг: при первом запуске создаём тестовые тиражи для всех лотерей */
  async onModuleInit() {
    const count = await this.drawRepo.count();
    if (!count) {
      const lotteries = await this.lotteryRepo.find();
      const seeds: Partial<Draw>[] = [];
      const now = new Date();
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      for (const lotto of lotteries) {
        seeds.push({
          lottery: lotto,
          drawTimeFrom: now,
          drawTimeTo: tomorrow,
          winningNumbers: [],
        });
      }
      if (seeds.length) {
        await this.drawRepo.save(seeds as Draw[]);
      }
    }
  }

  create(dto: CreateDrawDto): Promise<Draw> {
    const draw = this.drawRepo.create({
      lottery: { id: dto.lotteryId } as Lottery,
      drawTimeFrom: new Date(dto.drawTimeFrom),
      drawTimeTo: new Date(dto.drawTimeTo),
    });
    const selectedWinnerNumbers = dto.winningNumbers;
    if (selectedWinnerNumbers && selectedWinnerNumbers.length !== draw.lottery.numbersDrawn) {
      throw new HttpException(`Must select exactly ${draw.lottery.numbersDrawn} numbers`, 400);
    }
    if (selectedWinnerNumbers && selectedWinnerNumbers.some((n) => n > draw.lottery.numbersTotal)) {
      throw new HttpException(`Numbers cannot be greater than ${draw.lottery.numbersTotal}`, 400);
    }
    if (dto.winningNumbers) draw.winningNumbers = dto.winningNumbers;

    return this.drawRepo.save(draw);
  }

  findAll(): Promise<Draw[]> {
    return this.drawRepo.find({ relations: ['lottery'] });
  }

  async findOne(id: number): Promise<Draw> {
    const draw = await this.drawRepo.findOne({
      where: { id },
      relations: ['lottery', 'tickets'],
    });
    if (!draw) throw new NotFoundException(`Тираж #${id} не найден`);
    return draw;
  }

  async update(id: number, dto: UpdateDrawDto): Promise<Draw> {
    const draw = await this.findOne(id);
    if (dto.lotteryId) {
      draw.lottery = (await this.lotteryRepo.findOne({ where: { id: dto.lotteryId } }))!;
    }
    const selectedWinnerNumbers = dto.winningNumbers;
    if (selectedWinnerNumbers && selectedWinnerNumbers.length !== draw.lottery.numbersDrawn) {
      throw new HttpException(`Must select exactly ${draw.lottery.numbersDrawn} numbers`, 400);
    }
    if (selectedWinnerNumbers && selectedWinnerNumbers.some((n) => n > draw.lottery.numbersTotal)) {
      throw new HttpException(`Numbers cannot be greater than ${draw.lottery.numbersTotal}`, 400);
    }
    if (dto.drawTimeFrom) draw.drawTimeFrom = new Date(dto.drawTimeFrom);
    if (dto.drawTimeTo) draw.drawTimeTo = new Date(dto.drawTimeTo);
    if (dto.isCompleted !== undefined) draw.isCompleted = dto.isCompleted;

    if (dto.winningNumbers) draw.winningNumbers = dto.winningNumbers;
    return this.drawRepo.save(draw);
  }

  /**
   * Подводит итоги тиража: рассчитывает выигрыш по одиночным билетам и синдикатам.
   */
  async settle(drawId: number): Promise<string> {
    // Загрузка тиража
    const draw = await this.drawRepo.findOne({
      where: { id: drawId, isCompleted: false },
      relations: ['lottery', 'tickets'],
    });
    if (!draw) {
      throw new NotFoundException(`Тираж #${drawId} не найден или уже завершён`);
    }
    if (!draw.winningNumbers || draw.winningNumbers.length === 0) {
      throw new HttpException('Winning numbers not set', 400);
    }

    // Расчет совпадений и выплат для одиночных билетов
    const tickets = await this.ticketRepo.find({
      where: { draw: { id: drawId }, isWinning: false },
      relations: ['user'],
    });
    const groups: Record<number, Ticket[]> = {};
    for (const ticket of tickets) {
      const matched = ticket.selectedNumbers.filter((n) =>
        (draw.winningNumbers ?? []).includes(n),
      ).length;
      groups[matched] = groups[matched] || [];
      groups[matched].push(ticket);
    }
    const totalSales = tickets.reduce((sum, t) => sum + +t.price, 0);
    const prizePool = totalSales * 0.7;
    const distribution: Record<number, number> = { 6: 0.5, 5: 0.2, 4: 0.15, 3: 0.15 };

    for (const [countStr, pct] of Object.entries(distribution)) {
      const count = +countStr;
      const winners = groups[count] || [];
      if (winners.length > 0) {
        const fund = prizePool * pct;
        const perWinner = fund / winners.length;
        for (const ticket of winners) {
          ticket.prize = perWinner;
          ticket.isWinning = true;
          ticket.user.balance_rub += perWinner;
        }
      }
    }

    draw.isCompleted = true;
    await this.drawRepo.save(draw);
    await this.ticketRepo.save(tickets);

    for (const ticket of tickets) {
      const result = ticket.isWinning ? 'win' : 'loss';
      // stake = цена билета в виртуальных единицах
      const stake = Number(ticket.price) * 100; // если price в рублях, умножаем на 100
      await this.bonusService.awardFloating(ticket.user.id, stake, result);
    }

    const usersToUpdate = Array.from(new Set(tickets.map((t) => t.user)));
    await this.userRepo.save(usersToUpdate);

    // Дополнительная логика для синдикатов
    const syndicates = await this.syndRepo.find({
      where: { draw: { id: drawId }, status: SyndicateStatus.PARTICIPATING },
    });
    for (const synd of syndicates) {
      const stickets = await this.stRepo.find({
        where: { syndicate: { id: synd.id } },
        relations: ['ticket', 'ticket.user', 'member'],
      });
      const totalSyndPrize = stickets.reduce((sum, st) => sum + +st.ticket.prize, 0);
      const totalSyndSpent = stickets.reduce((sum, st) => sum + +st.member.amountSpent, 0);

      // Отзываем индивидуальные выплаты: у ticket.user уже начислено, нужно списать
      const refunds = new Map<number, number>();
      for (const st of stickets) {
        const uid = st.ticket.user.id;
        refunds.set(uid, (refunds.get(uid) || 0) + +st.ticket.prize);
      }
      for (const [uid, amount] of refunds) {
        const user = await this.userRepo.findOne({ where: { id: uid } });
        if (user) {
          user.balance_rub -= amount;
          await this.userRepo.save(user);
        }
      }

      // Распределяем синдикатный приз
      const members = await this.memberRepo.find({
        where: { syndicate: { id: synd.id } },
        relations: ['user'],
      });
      for (const member of members) {
        const share = member.amountSpent / totalSyndSpent;
        const payout = totalSyndPrize * share;
        console.log(`Member ${member.user.id} gets ${payout.toFixed(2)} from syndicate ${synd.id}`);
        member.user.balance_rub = Number(member.user.balance_rub) + Number(payout);
        await this.userRepo.save(member.user);
      }

      synd.status = SyndicateStatus.COMPLETED;
      await this.syndRepo.save(synd);
    }

    return `Итоги тиража #${drawId} подведены. Призовой фонд: ${prizePool.toFixed(2)} руб.`;
  }
  async remove(id: number): Promise<void> {
    const result = await this.drawRepo.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Тираж #${id} не найден`);
    }
  }
}
