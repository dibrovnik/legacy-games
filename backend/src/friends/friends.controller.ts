import { Controller, UseGuards, Post, Delete, Get, Param, Body, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { FriendsService } from './friends.service';
import { CreateFriendDto } from './dto/create-friend.dto';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';

@ApiTags('Друзья')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('friends')
export class FriendsController {
  constructor(private readonly friendsService: FriendsService) {}

  @Post()
  @ApiOperation({ summary: 'Отправить запрос в друзья' })
  @ApiBody({ type: CreateFriendDto, description: '{ recipientId: number }' })
  @ApiResponse({ status: 201, description: 'Запрос отправлен' })
  addFriend(@Request() req, @Body() dto: CreateFriendDto) {
    return this.friendsService.requestFriendship(req.user.id, dto.recipientId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Удалить друга или отменить запрос' })
  @ApiParam({
    name: 'id',
    description: 'ID друга или пользователя, которому отменяем запрос',
    type: Number,
  })
  @ApiResponse({ status: 200, description: 'Друг удалён или запрос отменён' })
  removeFriend(@Request() req, @Param('id') otherId: number) {
    return this.friendsService.removeFriend(req.user.id, +otherId);
  }

  @Get()
  @ApiOperation({ summary: 'Получить список друзей' })
  @ApiResponse({ status: 200, description: 'Список друзей' })
  getFriends(@Request() req) {
    return this.friendsService.getFriends(req.user.id);
  }

  @Post(':id/accept')
  @ApiOperation({ summary: 'Принять запрос в друзья' })
  @ApiParam({ name: 'id', description: 'ID пользователя, отправившего запрос', type: Number })
  @ApiResponse({ status: 200, description: 'Запрос принят' })
  accept(@Request() req, @Param('id') requesterId: number) {
    return this.friendsService.acceptRequest(req.user.id, +requesterId);
  }

  @Post(':id/decline')
  @ApiOperation({ summary: 'Отклонить запрос в друзья' })
  @ApiParam({ name: 'id', description: 'ID пользователя, отправившего запрос', type: Number })
  @ApiResponse({ status: 200, description: 'Запрос отклонён' })
  decline(@Request() req, @Param('id') requesterId: number) {
    return this.friendsService.declineRequest(req.user.id, +requesterId);
  }

  @Get('requests/incoming')
  @ApiOperation({ summary: 'Входящие запросы в друзья' })
  @ApiResponse({ status: 200, description: 'Список входящих запросов' })
  getIncoming(@Request() req) {
    return this.friendsService.getIncomingRequests(req.user.id);
  }
}
