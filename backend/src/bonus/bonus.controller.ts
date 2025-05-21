// src/controllers/bonus.controller.ts
import { Controller, Post, Request, UseGuards, Body } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiUnauthorizedResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { BonusService } from './bonus.service';

@ApiTags('Бонусы пользователя')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users/me/bonus')
export class BonusController {
  constructor(private readonly bonus: BonusService) {}

  @Post('telegram')
  @ApiOperation({ summary: 'Выдать бонус за подписку в Telegram' })
  @ApiOkResponse({
    description: 'Количество начисленных виртуальных единиц',
    schema: { type: 'number', example: 50 },
  })
  giveTelegram(@Request() req) {
    return this.bonus.awardFixed(req.user.id, 'telegram_subscribe');
  }

  @Post('ticket')
  @ApiOperation({ summary: 'Выдать бонус за покупку билета' })
  @ApiOkResponse({
    description: 'Количество начисленных виртуальных единиц',
    schema: { type: 'number', example: 10 },
  })
  giveTicket(@Request() req) {
    return this.bonus.awardFixed(req.user.id, 'ticket_purchase');
  }
}
