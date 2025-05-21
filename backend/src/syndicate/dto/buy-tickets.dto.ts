// src/syndicates/dto/buy-tickets.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsArray, ArrayNotEmpty, ArrayMinSize, IsInt, Min } from 'class-validator';

/**
 * DTO для покупки билетов в рамках синдиката
 */
export class BuyTicketsDto {
  @ApiProperty({
    description: 'Массив массивов выбранных номеров для каждого билета',
    type: 'array',
    items: { type: 'array', items: { type: 'number' } },
  })
  @IsArray({ message: 'selections должен быть массивом' })
  @ArrayNotEmpty({ message: 'Должен быть как минимум один билет' })
  @IsArray({ each: true, message: 'Каждый элемент должен быть массивом чисел' })
  selections: number[][];
}
