// src/friends/friends.service.ts
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { Repository, FindOperator, In } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { FriendStatus } from './friend-status.enum';
import { UsersService } from '../users/users.service';
import { Friend } from 'src/entities/friend.entity';

@Injectable()
export class FriendsService {
  constructor(
    @InjectRepository(Friend)
    private readonly friendsRepo: Repository<Friend>,
    private readonly usersService: UsersService,
  ) {}

  // 1) отправить запрос
  async requestFriendship(requesterId: number, recipientId: number): Promise<Friend> {
    if (requesterId === recipientId) {
      throw new BadRequestException(`Нельзя добавить себя в друзья`);
    }

    const [requester, recipient] = await Promise.all([
      this.usersService.findById(requesterId),
      this.usersService.findById(recipientId),
    ]);
    if (!requester) throw new NotFoundException(`Пользователь #${requesterId} не найден`);
    if (!recipient) throw new NotFoundException(`Пользователь #${recipientId} не найден`);

    const exists = await this.friendsRepo.findOne({
      where: { requester: { id: requesterId }, recipient: { id: recipientId } },
    });
    if (exists) {
      throw new BadRequestException(`Запрос уже отправлен`);
    }

    const friend = this.friendsRepo.create({
      requester,
      recipient,
      status: FriendStatus.PENDING,
    });
    return this.friendsRepo.save(friend);
  }

  // 2) удалить дружбу или отменить запрос
  async removeFriend(requesterId: number, recipientId: number): Promise<void> {
    const r = await this.friendsRepo.findOne({
      where: [
        { requester: { id: requesterId }, recipient: { id: recipientId } },
        { requester: { id: recipientId }, recipient: { id: requesterId } },
      ],
    });
    if (!r) throw new NotFoundException(`Дружба/запрос не найдены`);
    await this.friendsRepo.delete(r.id);
  }

  // 3) получить список друзей (только пользователей)
  async getFriends(userId: number): Promise<any[]> {
    const friends = await this.friendsRepo.find({
      where: [
        { requester: { id: userId }, status: FriendStatus.ACCEPTED },
        { recipient: { id: userId }, status: FriendStatus.ACCEPTED },
      ],
      relations: ['requester', 'recipient'],
    });

    // Вернуть только пользователей-друзей (не сам userId)
    return friends.map((f) => {
      const friendUser = f.requester.id === userId ? f.recipient : f.requester;
      // Можно выбрать только нужные поля:
      const { id, first_name, last_name, avatar, phone, email } = friendUser;
      return { id, first_name, last_name, avatar, phone, email };
    });
  }

  // 4) принять запрос
  async acceptRequest(recipientId: number, requesterId: number): Promise<Friend> {
    const fr = await this.friendsRepo.findOne({
      where: {
        requester: { id: requesterId },
        recipient: { id: recipientId },
        status: FriendStatus.PENDING,
      },
    });
    if (!fr) throw new NotFoundException(`Запрос не найден`);
    fr.status = FriendStatus.ACCEPTED;
    return this.friendsRepo.save(fr);
  }

  // 5) отклонить запрос
  async declineRequest(recipientId: number, requesterId: number): Promise<Friend> {
    const fr = await this.friendsRepo.findOne({
      where: {
        requester: { id: requesterId },
        recipient: { id: recipientId },
        status: FriendStatus.PENDING,
      },
    });
    if (!fr) throw new NotFoundException(`Запрос не найден`);
    fr.status = FriendStatus.DECLINED;
    return this.friendsRepo.save(fr);
  }

  // (Опционально) получить все входящие запросы
  async getIncomingRequests(userId: number): Promise<Friend[]> {
    return this.friendsRepo.find({
      where: { recipient: { id: userId }, status: FriendStatus.PENDING },
    });
  }
}
