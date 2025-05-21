// import { Controller, Post, Body, Param, Get, ParseIntPipe } from '@nestjs/common';
// import { BattleRoyalService } from './battleroyal.service';
// import { ApiTags, ApiOperation, ApiParam, ApiBody, ApiResponse } from '@nestjs/swagger';
// import { JoinBattleRoyalDto } from './dto/join-battleroyal.dto';
// import { CreateBattleRoyalDto } from './dto/create-battleroyal.dto';
// import { CreateBattleRoyalDrawDto } from './dto/create-draw.dto';

// @ApiTags('BattleRoyal')
// @Controller('battleroyal')
// export class BattleRoyalController {
//   constructor(private readonly service: BattleRoyalService) {}

//   @Post('draw')
//   @ApiOperation({ summary: 'Создать тираж BattleRoyal' })
//   @ApiBody({ type: CreateBattleRoyalDrawDto })
//   @ApiResponse({ status: 201, description: 'Тираж успешно создан' })
//   createDraw(@Body() dto: CreateBattleRoyalDrawDto) {
//     return this.service.createDraw(dto);
//   }

//   @Post()
//   @ApiOperation({ summary: 'Создать новую игру BattleRoyal на основе тиража' })
//   @ApiBody({ type: CreateBattleRoyalDto })
//   create(@Body() dto: CreateBattleRoyalDto) {
//     return this.service.create(dto);
//   }

//   // @Post('join')
//   // @ApiOperation({ summary: 'Присоединиться к игре и выбрать число' })
//   // @ApiBody({ type: JoinBattleRoyalDto })
//   // join(@Body() dto: JoinBattleRoyalDto) {
//   //   return this.service.joinRoom(dto);
//   // }

//   @Get(':id/state/:userId')
//   @ApiOperation({ summary: 'Получить текущее состояние игры для игрока' })
//   @ApiParam({ name: 'id', description: 'ID BattleRoyal' })
//   @ApiParam({ name: 'userId', description: 'ID пользователя' })
//   getState(@Param('id', ParseIntPipe) id: number, @Param('userId', ParseIntPipe) userId: number) {
//     return this.service.getState(id, userId);
//   }

//   // next(@Param('id', ParseIntPipe) id: number) {
//   //   return this.service.nextPhase(id);
//   // }
// }
