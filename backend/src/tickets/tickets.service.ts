import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { BuyTicketDto } from './dto/buy-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { Ticket } from 'src/entities/ticket.entity';
import { Draw } from 'src/entities/draw.entity';
import { User } from 'src/entities/user.entity';
import { BonusService } from 'src/bonus/bonus.service';

@Injectable()
export class TicketsService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(Ticket)
    private readonly ticketRepo: Repository<Ticket>,
    @InjectRepository(Draw)
    private readonly drawRepo: Repository<Draw>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly bonusService: BonusService,
  ) {}

  // async buyTicket(userId: number, dto: BuyTicketDto): Promise<Ticket> {
  //   const draw = await this.drawRepo.findOne({
  //     where: { id: dto.drawId },
  //     relations: ['lottery'],
  //   });
  //   if (!draw) throw new NotFoundException(`Draw #${dto.drawId} not found`);

  //   const total = draw.lottery.numbersDrawn;
  //   if (dto.selectedNumbers.length !== total) {
  //     throw new BadRequestException(`Must select exactly ${total} numbers`);
  //   }

  //   // Optional: validate range
  //   const max = draw.lottery.numbersTotal;
  //   for (const num of dto.selectedNumbers) {
  //     if (num < 1 || num > max) {
  //       throw new BadRequestException(`Number ${num} out of allowed range 1..${max}`);
  //     }
  //   }

  //   const ticket = this.ticketRepo.create({
  //     draw,
  //     user: { id: userId } as User,
  //     selectedNumbers: dto.selectedNumbers,
  //     price: draw.lottery.basePrice,
  //   });

  //   return this.ticketRepo.save(ticket);
  // }

  findByUser(userId: number): Promise<Ticket[]> {
    return this.ticketRepo.find({
      where: { user: { id: userId } },
      relations: ['draw', 'draw.lottery'],
    });
  }

  findAll(): Promise<Ticket[]> {
    return this.ticketRepo.find({ relations: ['draw', 'user'] });
  }

  async findOne(id: number): Promise<Ticket> {
    const ticket = await this.ticketRepo.findOne({
      where: { id },
      relations: ['draw', 'user', 'draw.lottery'],
    });
    if (!ticket) throw new NotFoundException(`Ticket #${id} not found`);
    return ticket;
  }

  async update(id: number, dto: UpdateTicketDto): Promise<Ticket> {
    const ticket = await this.findOne(id);
    if (dto.selectedNumbers) {
      ticket.selectedNumbers = dto.selectedNumbers;
    }
    // price re-calc if needed
    return this.ticketRepo.save(ticket);
  }

  async remove(id: number): Promise<void> {
    const result = await this.ticketRepo.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Ticket #${id} not found`);
    }
  }

  /**
   * Покупка билета: атомарно проверяем баланс, списываем и создаём билет.
   */
  async buyTicket(userId: number, dto: BuyTicketDto): Promise<Ticket> {
    return await this.dataSource.transaction(async (manager) => {
      // 1. Загрузка пользователя и тиража
      const user = await manager.findOne(User, { where: { id: userId } });
      if (!user) throw new NotFoundException('Пользователь не найден');

      const draw = await manager.findOne(Draw, {
        where: { id: dto.drawId },
        relations: ['lottery'],
      });
      if (!draw) throw new NotFoundException('Тираж не найден');

      // Ensure price and balance are numbers for correct comparison
      const price = Number(draw.lottery.basePrice);
      const userBalance = Number(user.balance_rub);

      if (userBalance < price) {
        console.log(user);
        console.log(draw);
        throw new BadRequestException('Недостаточно средств на балансе');
      }

      // 2. Списание средств
      user.balance_rub -= price;
      await manager.save(User, user);

      const selectedNumbers = dto.selectedNumbers;
      if (selectedNumbers && selectedNumbers.length !== draw.lottery.numbersDrawn) {
        throw new BadRequestException(`Must select exactly ${draw.lottery.numbersDrawn} numbers`);
      }
      if (selectedNumbers && selectedNumbers.some((n) => n > draw.lottery.numbersTotal)) {
        throw new BadRequestException(
          `Numbers cannot be greater than ${draw.lottery.numbersTotal}`,
        );
      }

      // 3. Создание билета
      const ticket = this.ticketRepo.create({
        draw,
        user,
        selectedNumbers: dto.selectedNumbers,
        price,
        isWinning: false,
        matchedCount: 0,
        prize: 0,
      });
      await this.bonusService.awardFixedTx(manager, user, 'ticket_purchase');
      return await manager.save(ticket);
    });
  }
}
