// src/battleroyal/dto/create-draw.dto.ts
import {
  IsInt,
  IsString,
  IsDateString,
  IsArray,
  IsNumber,
  ArrayMinSize,
  Min,
  Max,
} from 'class-validator';

export class CreateBattleRoyalDrawDto {
  @IsInt()
  gridSize: number; // Например, 10 для 10x10

  @IsInt()
  roundTimeMs: number; // Например, 10000 для 10 секунд

  @IsArray()
  @IsNumber({}, { each: true })
  @ArrayMinSize(1)
  @Min(0.01, { each: true }) // Minimum 1% remaining (0.01)
  @Max(0.99, { each: true }) // Maximum 99% remaining (0.99)
  removalPhases: number[]; // Массив процентов оставшихся чисел на каждой фазе (e.g., [0.5, 0.3, 0.4, 0.8])

  @IsDateString()
  startsAt: string; // Дата и время начала тиража
}
