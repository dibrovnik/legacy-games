// src/controllers/vip-settings.controller.ts
import { Controller, Get, Put, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiOkResponse,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiBody,
  ApiProperty,
} from '@nestjs/swagger';
import { VipSettingsService } from './vip-settings.service';

class UpdateVipSettingsDto {
  @ApiProperty({ description: 'Стоимость подписки в рублях', example: 500.0 })
  price_rub: number;

  @ApiProperty({ description: 'Длительность подписки в месяцах', example: 1 })
  duration_months: number;
}

@ApiTags('Настройки VIP-подписки')
@ApiBearerAuth()
@Controller('settings/vip')
@UseGuards(JwtAuthGuard)
export class VipSettingsController {
  constructor(private readonly vipSettingsService: VipSettingsService) {}

  @Get()
  @ApiOperation({ summary: 'Получить текущие настройки VIP-подписки' })
  @ApiOkResponse({
    description: 'Объект настроек VIP-подписки',
    schema: {
      properties: {
        id: { type: 'number', example: 1 },
        price_rub: { type: 'number', example: 500.0 },
        duration_months: { type: 'number', example: 1 },
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Пользователь не авторизован' })
  @ApiForbiddenResponse({ description: 'Недостаточно прав' })
  async get() {
    return this.vipSettingsService.find();
  }

  @Put()
  @ApiOperation({ summary: 'Обновить настройки VIP-подписки' })
  @ApiBody({ type: UpdateVipSettingsDto })
  @ApiOkResponse({
    description: 'Обновлённые настройки VIP-подписки',
    schema: {
      properties: {
        id: { type: 'number', example: 1 },
        price_rub: { type: 'number', example: 600.0 },
        duration_months: { type: 'number', example: 2 },
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Пользователь не авторизован' })
  @ApiForbiddenResponse({ description: 'Недостаточно прав' })
  async update(@Body() dto: UpdateVipSettingsDto) {
    return this.vipSettingsService.update(dto.price_rub, dto.duration_months);
  }
}
