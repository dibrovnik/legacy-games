// src/controllers/vip.controller.ts
import { Controller, Post, Delete, Get, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { VipService } from './vip.service';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiOkResponse,
  ApiUnauthorizedResponse,
  ApiBadRequestResponse,
} from '@nestjs/swagger';

@ApiTags('VIP-подписка')
@ApiBearerAuth()
@Controller('users/me/vip')
@UseGuards(JwtAuthGuard)
export class VipController {
  constructor(private readonly vipService: VipService) {}

  @Post()
  @ApiOperation({ summary: 'Оформить или продлить VIP-подписку на месяц' })
  @ApiOkResponse({
    description:
      'Подписка успешно оформлена или продлена; возвращаются обновлённые данные пользователя',
    schema: {
      properties: {
        id: { type: 'number', example: 42 },
        vip_expires_at: {
          type: 'string',
          format: 'date-time',
          example: '2025-06-20T00:00:00.000Z',
        },
        vip_auto_renew: { type: 'boolean', example: true },
        balance_rub: { type: 'number', example: 950.0 },
      },
    },
  })
  @ApiBadRequestResponse({ description: 'Недостаточно средств на балансе или неверные данные' })
  @ApiUnauthorizedResponse({ description: 'Пользователь не авторизован' })
  /** Оформить или продлить подписку */
  subscribe(@Request() req) {
    console.log('VIP subscribe', req.user.id);
    return this.vipService.subscribe(req.user.id);
  }

  @Delete()
  @ApiOperation({ summary: 'Отменить автоматическое продление VIP-подписки' })
  @ApiOkResponse({
    description: 'Автопродление успешно отменено; возвращаются обновлённые данные пользователя',
    schema: {
      properties: {
        id: { type: 'number', example: 42 },
        vip_auto_renew: { type: 'boolean', example: false },
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Пользователь не авторизован' })
  /** Отменить автопродление */
  cancel(@Request() req) {
    return this.vipService.cancelAutoRenew(req.user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Получить текущий статус VIP-подписки' })
  @ApiOkResponse({
    description: 'Статус VIP-подписки пользователя',
    schema: {
      properties: {
        active: { type: 'boolean', example: true },
        expiresAt: { type: 'string', format: 'date-time', example: '2025-06-20T00:00:00.000Z' },
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Пользователь не авторизован' })
  /** Узнать статус VIP */
  status(@Request() req) {
    return this.vipService.getStatus(req.user.id);
  }
}
