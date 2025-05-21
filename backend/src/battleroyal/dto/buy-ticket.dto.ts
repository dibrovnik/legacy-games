import { IsInt, IsArray, ArrayMinSize, ArrayMaxSize, IsNumber, Min, Max } from 'class-validator';

export class BuyTicketDto {
  @IsInt()
  @Min(1)
  battleRoyalId: number;

  @IsInt()
  @Min(1)
  userId: number;

  @IsArray()
  @IsNumber({}, { each: true })
  @Min(1, { each: true })
  @Max(100, { each: true }) // Assuming grid is 10x10 = 100 numbers
  @ArrayMinSize(1)
  @ArrayMaxSize(5) // Max 5 selections
  selectedNumbers: number[];
}
