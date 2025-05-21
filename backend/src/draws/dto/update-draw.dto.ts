// src/draws/dto/update-draw.dto.ts
import { PartialType } from '@nestjs/swagger';
import { CreateDrawDto } from './create-draw.dto';

export class UpdateDrawDto extends PartialType(CreateDrawDto) {}
