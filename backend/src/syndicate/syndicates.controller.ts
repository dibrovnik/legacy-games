// src/syndicates/syndicates.controller.ts
import { Controller, Post, Body, Param, ParseIntPipe, Get, Req, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { SyndicatesService } from './syndicates.service';
import { CreateSyndicateDto } from './dto/create-syndicate.dto';
import { InviteDto } from './dto/invite.dto';
import { BuyTicketsDto } from './dto/buy-tickets.dto';
import { Syndicate } from 'src/entities/syndicate.entity';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';

@ApiTags('Синдикаты')
@ApiBearerAuth()
@Controller('syndicates')
export class SyndicatesController {
  constructor(private readonly syndicatesService: SyndicatesService) {}

  /**
   * Создать новое лобби синдиката
   */
  @UseGuards(JwtAuthGuard)
  @Post()
  @ApiOperation({ summary: 'Создать лобби синдиката' })
  @ApiResponse({ status: 201, description: 'Лобби успешно создано', type: Syndicate })
  create(@Body() dto: CreateSyndicateDto, @Req() req: any) {
    const userId = req.user.id;
    return this.syndicatesService.createSyndicate(userId, dto.drawId, dto.maxMembers);
  }

  /**
   * Пригласить друга в существующий синдикат
   */
  @UseGuards(JwtAuthGuard)
  @Post(':id/invite')
  @ApiParam({ name: 'id', description: 'ID синдиката' })
  @ApiOperation({ summary: 'Пригласить друга в синдикат' })
  @ApiBody({ type: InviteDto })
  @ApiResponse({ status: 200, description: 'Приглашение отправлено' })
  invite(@Param('id', ParseIntPipe) id: number, @Body() dto: InviteDto, @Req() req: any) {
    return this.syndicatesService.invite(id, req.user.id, dto.friendId);
  }

  /**
   * Вступить в синдикат
   */
  @UseGuards(JwtAuthGuard)
  @Post(':id/join')
  @ApiParam({ name: 'id', description: 'ID синдиката' })
  @ApiOperation({ summary: 'Вступить в синдикат' })
  @ApiResponse({ status: 201, description: 'Вы присоединились к синдикату', type: 'object' })
  join(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.syndicatesService.join(id, req.user.id);
  }

  /**
   * Отметить готовность для покупки билетов
   */
  @UseGuards(JwtAuthGuard)
  @Post(':id/ready')
  @ApiParam({ name: 'id', description: 'ID синдиката' })
  @ApiOperation({ summary: 'Отметить готовность участия' })
  @ApiResponse({ status: 200, description: 'Статус готовности обновлён' })
  ready(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.syndicatesService.ready(id, req.user.id);
  }

  /**
   * Купить билеты для синдиката
   */
  @UseGuards(JwtAuthGuard)
  @Post(':id/tickets')
  @ApiParam({ name: 'id', description: 'ID синдиката' })
  @ApiOperation({ summary: 'Покупка билетов в синдикате' })
  @ApiBody({ type: BuyTicketsDto })
  @ApiResponse({ status: 200, description: 'Билеты успешно куплены' })
  buyTickets(@Param('id', ParseIntPipe) id: number, @Body() dto: BuyTicketsDto, @Req() req: any) {
    return this.syndicatesService.buyTickets(id, req.user.id, dto.selections);
  }

  /**
   * Получить список синдикатов пользователя
   */
  @UseGuards(JwtAuthGuard)
  @Get()
  @ApiOperation({ summary: 'Список своих синдикатов' })
  @ApiResponse({ status: 200, description: 'Массив синдикатов', type: [Syndicate] })
  getMy(@Req() req: any) {
    return this.syndicatesService.getByUser(req.user.id);
  }
}
