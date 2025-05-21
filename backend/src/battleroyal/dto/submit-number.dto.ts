// dto/submit-number.dto.ts
import { ApiProperty } from '@nestjs/swagger';
export class SubmitNumberDto {
  @ApiProperty() battleRoyalId: number;
  @ApiProperty() userId: number;
  @ApiProperty() selectedNumber: number;
}
