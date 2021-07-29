import { ApiProperty } from '@nestjs/swagger';
export class CreateDiscountDto {
  @ApiProperty()
  type: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  value: number;

  @ApiProperty()
  isPercentage: boolean;
}
