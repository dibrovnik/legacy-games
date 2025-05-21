// src/battleroyal/dto/join-room.dto.ts
import { ApiProperty } from '@nestjs/swagger';

export class JoinBattleRoyalDto {
  @ApiProperty({ example: 1 }) battleRoyalId: number;
  @ApiProperty({ example: 42 }) userId: number;
}
