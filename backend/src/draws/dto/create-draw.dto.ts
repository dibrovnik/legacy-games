import { IsInt, IsDateString, IsOptional, ArrayNotEmpty, ArrayUnique } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateDrawDto {
  @ApiProperty({ description: 'ID лотереи' })
  @IsInt()
  lotteryId: number;

  @ApiProperty({
    description: 'Дата и время начала приёма ставок',
    type: String,
    format: 'date-time',
  })
  @IsDateString()
  drawTimeFrom: string;

  @ApiProperty({
    description: 'Дата и время окончания приёма ставок',
    type: String,
    format: 'date-time',
  })
  @IsDateString()
  drawTimeTo: string;

  @ApiPropertyOptional({ description: 'Выпавшие числа', type: [Number] })
  @IsOptional()
  @ArrayNotEmpty()
  @ArrayUnique()
  winningNumbers?: number[];

  @ApiPropertyOptional({ description: 'Завершен ли тираж' })
  @IsOptional()
  @IsInt()
  isCompleted?: boolean;
}
