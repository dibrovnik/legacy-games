import { Controller, Get, Post, Body, Param, Patch, Delete, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { DrawsService } from './draws.service';
import { CreateDrawDto } from './dto/create-draw.dto';
import { UpdateDrawDto } from './dto/update-draw.dto';
import { Draw } from 'src/entities/draw.entity';

@ApiTags('Тиражи')
@Controller('draws')
export class DrawsController {
  constructor(private readonly service: DrawsService) {}

  @Post()
  @ApiOperation({ summary: 'Создать новый тираж' })
  @ApiResponse({ status: 201, description: 'Тираж успешно создан', type: Draw })
  @ApiResponse({ status: 400, description: 'Неверные данные' })
  create(@Body() dto: CreateDrawDto): Promise<Draw> {
    return this.service.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Получить список всех тиражей' })
  @ApiResponse({ status: 200, description: 'Список тиражей', type: [Draw] })
  findAll(): Promise<Draw[]> {
    return this.service.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Получить тираж по ID' })
  @ApiParam({ name: 'id', description: 'ID тиража', example: 1 })
  @ApiResponse({ status: 200, description: 'Тираж найден', type: Draw })
  @ApiResponse({ status: 404, description: 'Тираж не найден' })
  findOne(@Param('id', ParseIntPipe) id: number): Promise<Draw> {
    return this.service.findOne(id);
  }

  @Post(':id/settle')
  @ApiOperation({ summary: 'Подвести итоги тиража и начислить победы' })
  @ApiParam({ name: 'id', description: 'ID тиража', example: 1 })
  @ApiResponse({ status: 200, description: 'Итоги подведены' })
  @ApiResponse({ status: 404, description: 'Тираж или выигрыши не найдены' })
  settle(@Param('id', ParseIntPipe) id: number): Promise<string> {
    return this.service.settle(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Обновить данные тиража' })
  @ApiParam({ name: 'id', description: 'ID тиража', example: 1 })
  @ApiResponse({ status: 200, description: 'Тираж успешно обновлён', type: Draw })
  @ApiResponse({ status: 404, description: 'Тираж не найден' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateDrawDto): Promise<Draw> {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Удалить тираж' })
  @ApiParam({ name: 'id', description: 'ID тиража', example: 1 })
  @ApiResponse({ status: 200, description: 'Тираж успешно удалён' })
  @ApiResponse({ status: 404, description: 'Тираж не найден' })
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.service.remove(id);
  }
}
