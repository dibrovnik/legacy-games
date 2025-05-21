import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Delete,
  Patch,
  Request,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TicketsService } from './tickets.service';
import { BuyTicketDto } from './dto/buy-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { Ticket } from 'src/entities/ticket.entity';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';

@ApiTags('Билеты')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('tickets')
export class TicketsController {
  constructor(private readonly service: TicketsService) {}

  @Post()
  @ApiOperation({ summary: 'Купить билет' })
  @ApiBody({ type: BuyTicketDto })
  @ApiResponse({ status: 201, description: 'Билет успешно куплен', type: Ticket })
  buy(@Request() req, @Body() dto: BuyTicketDto): Promise<Ticket> {
    return this.service.buyTicket(req.user.id, dto);
  }

  @Get('mine')
  @ApiOperation({ summary: 'Получить свои билеты' })
  @ApiResponse({ status: 200, description: 'Список билетов пользователя', type: [Ticket] })
  getMine(@Request() req): Promise<Ticket[]> {
    return this.service.findByUser(req.user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Получить все билеты' })
  @ApiResponse({ status: 200, description: 'Список всех билетов', type: [Ticket] })
  findAll(): Promise<Ticket[]> {
    return this.service.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Получить билет по ID' })
  @ApiParam({ name: 'id', description: 'ID билета', type: Number })
  @ApiResponse({ status: 200, description: 'Информация о билете', type: Ticket })
  findOne(@Param('id', ParseIntPipe) id: number): Promise<Ticket> {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @ApiBody({ type: BuyTicketDto })
  @ApiOperation({ summary: 'Обновить билет' })
  @ApiParam({ name: 'id', description: 'ID билета', type: Number })
  @ApiResponse({ status: 200, description: 'Билет обновлен', type: Ticket })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateTicketDto): Promise<Ticket> {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Удалить билет' })
  @ApiParam({ name: 'id', description: 'ID билета', type: Number })
  @ApiResponse({ status: 204, description: 'Билет удалён' })
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.service.remove(id);
  }
}
