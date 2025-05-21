// src/lottery-types/lottery-types.controller.ts
import { Controller, Get, Post, Body, Param, Patch, Delete, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody } from '@nestjs/swagger';
import { LotteryTypesService } from './lottery-types.service';
import { CreateLotteryTypeDto } from './dto/create-lottery-type.dto';
import { UpdateLotteryTypeDto } from './dto/update-lottery-type.dto';
import { LotteryType } from 'src/entities/lottery-type.entity';

@ApiTags('Типы лотерей')
@Controller('lottery-types')
export class LotteryTypesController {
  constructor(private readonly service: LotteryTypesService) {}

  @Post()
  @ApiOperation({ summary: 'Создать новый тип лотереи' })
  @ApiBody({ type: CreateLotteryTypeDto })
  @ApiResponse({ status: 201, description: 'Тип лотереи успешно создан', type: LotteryType })
  create(@Body() dto: CreateLotteryTypeDto): Promise<LotteryType> {
    return this.service.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Получить все типы лотерей' })
  @ApiResponse({ status: 200, description: 'Список типов лотерей', type: [LotteryType] })
  findAll(): Promise<LotteryType[]> {
    return this.service.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Получить тип лотереи по ID' })
  @ApiParam({ name: 'id', description: 'ID типа лотереи', type: Number })
  @ApiResponse({ status: 200, description: 'Тип лотереи найден', type: LotteryType })
  findOne(@Param('id', ParseIntPipe) id: number): Promise<LotteryType> {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Обновить тип лотереи по ID' })
  @ApiParam({ name: 'id', description: 'ID типа лотереи', type: Number })
  @ApiBody({ type: UpdateLotteryTypeDto })
  @ApiResponse({ status: 200, description: 'Тип лотереи обновлён', type: LotteryType })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateLotteryTypeDto,
  ): Promise<LotteryType> {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Удалить тип лотереи по ID' })
  @ApiParam({ name: 'id', description: 'ID типа лотереи', type: Number })
  @ApiResponse({ status: 200, description: 'Тип лотереи удалён' })
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.service.remove(id);
  }
}
