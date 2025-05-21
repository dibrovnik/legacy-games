// src/lotteries/lotteries.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  ParseIntPipe,
  BadRequestException,
  UploadedFile,
  UseInterceptors,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiConsumes,
  ApiQuery,
} from '@nestjs/swagger';
import { LotteriesService } from './lotteries.service';
import { CreateLotteryDto } from './dto/create-lottery.dto';
import { UpdateLotteryDto } from './dto/update-lottery.dto';
import { Lottery } from 'src/entities/lottery.entity';
import { FileInterceptor } from '@nestjs/platform-express';
import { FilterLotteryDto } from './dto/filter-lottery.dto';

@ApiTags('Лотереи')
@Controller('lotteries')
export class LotteriesController {
  constructor(private readonly service: LotteriesService) {}

  @Post()
  @ApiOperation({ summary: 'Создать новую лотерею' })
  @ApiBody({ type: CreateLotteryDto, description: 'Данные для создания лотереи' })
  @ApiResponse({ status: 201, description: 'Лотерея успешно создана', type: Lottery })
  create(@Body() dto: CreateLotteryDto): Promise<Lottery> {
    return this.service.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Получить список лотерей с опциональными фильтрами' })
  @ApiResponse({ status: 200, description: 'Список лотерей', type: [Lottery] })
  @ApiQuery({ type: FilterLotteryDto, required: false })
  findAll(@Query() filter: FilterLotteryDto): Promise<Lottery[]> {
    return this.service.findAll(filter);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Получить лотерею по ID' })
  @ApiParam({ name: 'id', type: Number, description: 'ID лотереи' })
  @ApiResponse({ status: 200, description: 'Лотерея найдена', type: Lottery })
  findOne(@Param('id', ParseIntPipe) id: number): Promise<Lottery> {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Обновить лотерею по ID' })
  @ApiParam({ name: 'id', type: Number, description: 'ID лотереи' })
  @ApiBody({ type: UpdateLotteryDto, description: 'Данные для обновления лотереи' })
  @ApiResponse({ status: 200, description: 'Лотерея успешно обновлена', type: Lottery })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateLotteryDto): Promise<Lottery> {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Удалить лотерею по ID' })
  @ApiParam({ name: 'id', type: Number, description: 'ID лотереи' })
  @ApiResponse({ status: 200, description: 'Лотерея успешно удалена' })
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.service.remove(id);
  }

  @Post('create-souvenir')
  @ApiOperation({ summary: 'Создать новую лотерею (сувенирная через JSON)' })
  @ApiBody({ type: CreateLotteryDto })
  @ApiResponse({ status: 201, description: 'Лотерея успешно создана', type: Lottery })
  async createSouvenir(@Body() dto: CreateLotteryDto): Promise<Lottery> {
    if (!dto.isSouvenir) {
      throw new BadRequestException('isSouvenir must be true for souvenir lottery');
    }
    return this.service.createSouvenir(dto);
  }
}
