// dto/update-lottery-type.dto.ts
import { PartialType } from '@nestjs/mapped-types';
import { CreateLotteryTypeDto } from './create-lottery-type.dto';

export class UpdateLotteryTypeDto extends PartialType(CreateLotteryTypeDto) {}
