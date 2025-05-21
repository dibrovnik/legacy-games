// src/syndicates/dto/invite.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsInt } from 'class-validator';

/**
 * DTO для приглашения друга в синдикат
 */
export class InviteDto {
  @ApiProperty({ description: 'ID друга, которого вы хотите пригласить' })
  @IsInt({ message: 'friendId должен быть целым числом' })
  friendId: number;
}
