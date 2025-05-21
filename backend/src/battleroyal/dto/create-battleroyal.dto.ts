import { ApiProperty } from '@nestjs/swagger';

export class CreateBattleRoyalDto {
  @ApiProperty({
    example: 1,
    description: 'ID тиража BattleRoyal, на основе которого создаётся игра',
  })
  drawId: number;
}
