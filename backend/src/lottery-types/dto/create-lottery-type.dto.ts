// dto/create-lottery-type.dto.ts
import { IsString, IsOptional } from 'class-validator';

export class CreateLotteryTypeDto {
  @IsString() name: string;
  @IsOptional() @IsString() description?: string;
}
