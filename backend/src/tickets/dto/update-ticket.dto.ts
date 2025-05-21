import { BuyTicketDto } from './buy-ticket.dto';
import { PartialType } from '@nestjs/mapped-types';

export class UpdateTicketDto extends PartialType(BuyTicketDto) {}
