// src/lotteries/dto/filter-lottery.dto.ts
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBooleanString, IsInt, IsOptional, IsString } from 'class-validator';
import { Transform } from 'class-transformer';

export class FilterLotteryDto {
  @ApiPropertyOptional({ description: 'Только сувенирные лотереи', example: 'true' })
  @IsOptional()
  @IsBooleanString()
  isSouvenir?: string; // примем как строку "true"/"false"

  @ApiPropertyOptional({ description: 'Фильтр по коду города', example: '67' })
  @IsOptional()
  @IsString()
  souvenirCityCode?: string;

  @ApiPropertyOptional({ description: 'Фильтр по типу лотереи', example: 1 })
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  lotteryTypeId?: number;

  @ApiPropertyOptional({ description: 'Фильтрация по части названия', example: 'Loto' })
  @IsOptional()
  @IsString()
  name?: string;
}
