// dto/buy-ticket.dto.ts
import { IsInt, ArrayNotEmpty, ArrayUnique } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class BuyTicketDto {
  @ApiProperty({
    description: 'Идентификатор тиража',
    example: 1,
  })
  @IsInt()
  drawId: number;

  @ApiProperty({
    description: 'Выбранные номера билета',
    example: [5, 12, 23, 34, 45],
    type: [Number],
    isArray: true,
  })
  @ArrayNotEmpty()
  @ArrayUnique()
  selectedNumbers: number[];
}
