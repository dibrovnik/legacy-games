// src/syndicates/dto/create-syndicate.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Min } from 'class-validator';

/**
 * DTO для создания нового синдиката (лоби)
 */
export class CreateSyndicateDto {
  @ApiProperty({ description: 'ID тиража, в котором будет участвовать синдикат' })
  @IsInt({ message: 'drawId должен быть целым числом' })
  drawId: number;

  @ApiProperty({ description: 'Максимальное количество участников в синдикате', minimum: 2 })
  @IsInt({ message: 'maxMembers должен быть целым числом' })
  @Min(2, { message: 'В синдикате должно быть как минимум 2 участника' })
  maxMembers: number;
}
