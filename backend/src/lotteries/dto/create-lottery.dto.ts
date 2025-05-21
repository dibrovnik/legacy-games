// dto/create-lottery.dto.ts
import { IsString, IsInt, Min, IsOptional, IsNumber, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateLotteryDto {
  @ApiProperty({ example: 1, description: 'ID типа лотереи' })
  @IsInt()
  lotteryTypeId: number;

  @ApiProperty({ example: 'Русское Лото', description: 'Название лотереи' })
  @IsString()
  name: string;

  @ApiPropertyOptional({
    example: 'Описание лотереи',
    description: 'Описание лотереи (необязательно)',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 36, description: 'Общее количество чисел в лотерее (минимум 1)' })
  @IsInt()
  @Min(1)
  numbersTotal: number;

  @ApiProperty({ example: 6, description: 'Количество выпадающих чисел (минимум 1)' })
  @IsInt()
  @Min(1)
  numbersDrawn: number;

  @ApiProperty({ example: 100, description: 'Базовая цена билета (минимум 0)' })
  @IsNumber()
  @Min(0)
  basePrice: number;

  @ApiPropertyOptional({ description: 'Флаг сувенирного билета', example: true })
  @IsOptional()
  @IsBoolean()
  isSouvenir?: boolean;

  @ApiPropertyOptional({ description: 'Код сувенирного города', example: 'AMS' })
  @IsOptional()
  @IsString()
  souvenirCityCode?: string;

  @ApiPropertyOptional({
    description: 'URL картинки билета',
    example: 'https://example.com/image.jpg',
  })
  @IsOptional()
  @IsString()
  imageUrl?: string;
}
