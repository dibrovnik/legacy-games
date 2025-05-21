import {
  Injectable,
  NotFoundException,
  BadRequestException,
  forwardRef,
  Inject,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MemberStatus, SyndicateMember } from 'src/entities/syndicate-member.entity';
import { SyndicateTicket } from 'src/entities/syndicate-ticket.entity';
import { Syndicate, SyndicateStatus } from 'src/entities/syndicate.entity';
import { Ticket } from 'src/entities/ticket.entity';
import { User } from 'src/entities/user.entity';
import { Repository, In } from 'typeorm';
import { DrawsService } from 'src/draws/draws.service';
import { Notification } from 'src/entities/notification';
import { TicketsService } from 'src/tickets/tickets.service';

@Injectable()
export class SyndicatesService {
  constructor(
    @InjectRepository(Syndicate) private syndRepo: Repository<Syndicate>,
    @InjectRepository(SyndicateMember) private memberRepo: Repository<SyndicateMember>,
    @InjectRepository(SyndicateTicket) private stRepo: Repository<SyndicateTicket>,
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(Notification) private notificationRepo: Repository<Notification>,
    @Inject(forwardRef(() => DrawsService)) private drawsService: DrawsService,
    @Inject(forwardRef(() => TicketsService))
    private ticketsService: TicketsService,
  ) {}

  async createSyndicate(hostId: number, drawId: number, maxMembers: number): Promise<Syndicate> {
    const draw = await this.drawsService.findOne(drawId);
    if (!draw) {
      throw new NotFoundException(`Тираж #${drawId} не найден`);
    }
    const synd = this.syndRepo.create({
      host: { id: hostId } as any,
      draw: { id: drawId } as any,
      maxMembers,
      status: SyndicateStatus.PENDING,
    });

    const saved = await this.syndRepo.save(synd);
    await this.join(saved.id, hostId);

    return saved;
  }

  async invite(syndicateId: number, requesterId: number, friendId: number): Promise<string> {
    const synd = await this.syndRepo.findOne({ where: { id: syndicateId }, relations: ['host'] });
    if (!synd) throw new NotFoundException(`Синдикат #${syndicateId} не найден`);
    if (synd.host.id !== requesterId) throw new BadRequestException(`Только хост может приглашать`);
    const friend = await this.userRepo.findOne({ where: { id: friendId } });
    if (!friend) throw new NotFoundException(`Пользователь #${friendId} не найден`);
    const note = this.notificationRepo.create({
      user: friend,
      message: `Вас приглашают в синдикат #${syndicateId}`,
    });
    await this.notificationRepo.save(note);

    return `Приглашение отправлено пользователю #${friendId}`;
  }

  async join(syndicateId: number, userId: number): Promise<SyndicateMember> {
    const synd = await this.syndRepo.findOne({
      where: { id: syndicateId, status: SyndicateStatus.PENDING },
    });
    if (!synd) throw new BadRequestException(`Нельзя присоединиться к этому синдикату`);
    const count = await this.memberRepo.count({ where: { syndicate: { id: syndicateId } } });
    if (count >= synd.maxMembers) throw new BadRequestException(`Синдикат полон`);

    const existingMember = await this.memberRepo.findOne({
      where: { syndicate: { id: syndicateId }, user: { id: userId } },
    });
    if (existingMember) {
      throw new BadRequestException('Вы уже являетесь участником этого синдиката');
    }

    const member = this.memberRepo.create({
      syndicate: { id: syndicateId } as any,
      user: { id: userId } as any,
    });
    const saved = await this.memberRepo.save(member);
    const newCount = count + 1;
    if (newCount === synd.maxMembers) {
      synd.status = SyndicateStatus.WAITING_FOR_READY;
      await this.syndRepo.save(synd);
    }
    return saved;
  }

  async ready(syndicateId: number, userId: number): Promise<void> {
    const synd = await this.syndRepo.findOne({ where: { id: syndicateId }, relations: ['host'] });
    if (!synd) throw new NotFoundException(`Синдикат #${syndicateId} не найден`);
    if (synd.host.id !== userId)
      throw new BadRequestException('Только владелец синдиката может отметить готовность');
    const members = await this.memberRepo.find({ where: { syndicate: { id: syndicateId } } });
    if (members.length === 0) throw new BadRequestException('Нет участников в синдикате');
    for (const member of members) {
      if (member.status !== MemberStatus.READY) {
        member.status = MemberStatus.READY;
        await this.memberRepo.save(member);
      }
    }
    synd.status = SyndicateStatus.BUYING;
    await this.syndRepo.save(synd);
  }

  async buyTickets(syndicateId: number, userId: number, selections: number[][]): Promise<void> {
    const synd = await this.syndRepo.findOne({
      where: { id: syndicateId, status: SyndicateStatus.BUYING },
      relations: ['draw'],
    });
    if (!synd) {
      throw new BadRequestException('Синдикат не готов к покупке билетов');
    }

    const member = await this.memberRepo.findOne({
      where: { syndicate: { id: syndicateId }, user: { id: userId } },
    });
    if (!member) {
      throw new NotFoundException('Вы не участник синдиката');
    }

    let totalSpent = 0;
    for (const numbers of selections) {
      const ticket: Ticket = await this.ticketsService.buyTicket(userId, {
        drawId: synd.draw.id,
        selectedNumbers: numbers,
      });
      const st = this.stRepo.create({
        syndicate: { id: syndicateId } as any,
        member: { id: member.id } as any,
        ticket,
      });
      await this.stRepo.save(st);

      totalSpent += Number(ticket.price);
    }

    member.amountSpent = Number(member.amountSpent) + totalSpent;
    await this.memberRepo.save(member);

    const allMembers = await this.memberRepo.find({
      where: { syndicate: { id: syndicateId } },
    });

    const allMembersBoughtTickets = allMembers.every((m) => Number(m.amountSpent) > 0);

    if (allMembersBoughtTickets) {
      synd.status = SyndicateStatus.PARTICIPATING;
    }
    await this.syndRepo.save(synd);
  }

  async handleDrawCompletion(drawId: number): Promise<void> {
    await this.drawsService.settle(drawId);
    const synds = await this.syndRepo.find({
      where: { draw: { id: drawId }, status: SyndicateStatus.PARTICIPATING },
    });
    for (const synd of synds) {
      const stickets = await this.stRepo.find({
        where: { syndicate: { id: synd.id } },
        relations: ['ticket', 'member', 'ticket.user'],
      });
      const totalSpent = stickets.map((s) => +s.member.amountSpent).reduce((a, b) => a + b, 0);
      const totalPrize = stickets.map((s) => +s.ticket.prize).reduce((a, b) => a + b, 0);
      const refunds = new Map<number, number>();
      for (const st of stickets) {
        const uid = st.ticket.user.id;
        refunds.set(uid, (refunds.get(uid) || 0) + +st.ticket.prize);
      }
      for (const [uid, amount] of refunds.entries()) {
        const user = await this.userRepo.findOne({ where: { id: uid } });
        if (user) {
          user.balance_rub = +user.balance_rub - amount;
          await this.userRepo.save(user);
        }
      }
      for (const member of await this.memberRepo.find({
        where: { syndicate: { id: synd.id } },
        relations: ['user'],
      })) {
        const fraction = +member.amountSpent / totalSpent;
        const payout = totalPrize * fraction;
        member.user.balance_rub = +member.user.balance_rub + payout;
        await this.userRepo.save(member.user);
      }
      synd.status = SyndicateStatus.COMPLETED;
      await this.syndRepo.save(synd);
    }
  }

  async getByUser(userId: number): Promise<Syndicate[]> {
    return this.syndRepo.find({
      where: [{ host: { id: userId } }, { members: { user: { id: userId } } }],
      relations: [
        'members',
        'tickets',
        'draw',
        'host',
        'members.user',
        'tickets.ticket',
        'tickets.member',
        'tickets.ticket.user',
      ],
    });
  }

  async getSyndicateDetails(syndicateId: number): Promise<Syndicate | null> {
    return this.syndRepo.findOne({
      where: { id: syndicateId },
      relations: [
        'host',
        'draw',
        'members',
        'members.user',
        'tickets',
        'tickets.ticket',
        'tickets.member',
        'tickets.ticket.user',
      ],
    });
  }

  async getAllAvailableSyndicates(): Promise<Syndicate[]> {
    return this.syndRepo.find({
      where: {
        status: In([SyndicateStatus.PENDING, SyndicateStatus.WAITING_FOR_READY]),
      },
      relations: ['host', 'draw', 'members', 'members.user'],
      order: {
        createdAt: 'DESC',
      },
    });
  }
}
