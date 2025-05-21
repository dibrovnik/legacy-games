// src/controllers/bonus-settings.controller.ts
import { Controller, Get, Put, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiOkResponse,
  ApiBody,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
} from '@nestjs/swagger';
import { BonusSettings } from 'src/entities/bonus-settings.entity';
import { BonusSettingsService } from './bonus-settings.service';

@ApiTags('Настройки бонусов')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard /*, сюда ваш PermissionGuard если нужен */)
@Controller('settings/bonus')
export class BonusSettingsController {
  constructor(private readonly bs: BonusSettingsService) {}

  @Get()
  @ApiOperation({ summary: 'Получить все бонус-настройки' })
  @ApiOkResponse({ type: BonusSettings })
  @ApiUnauthorizedResponse({ description: 'Неавторизован' })
  async get() {
    return this.bs.find();
  }

  @Put()
  @ApiOperation({ summary: 'Обновить бонус-настройки' })
  @ApiBody({ type: BonusSettings })
  @ApiOkResponse({ type: BonusSettings })
  @ApiUnauthorizedResponse({ description: 'Неавторизован' })
  @ApiForbiddenResponse({ description: 'Нет прав' })
  update(@Body() dto: Partial<BonusSettings>) {
    return this.bs.update(dto);
  }
}
