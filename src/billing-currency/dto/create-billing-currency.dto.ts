import { IsNumber, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
export class CreateBillingCurrencyDto {
  @IsString()
  @ApiProperty()
  name: string;
  @IsNumber()
  @ApiProperty()
  rate: number;
}
