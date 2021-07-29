import { IsNumber, IsString, ValidateNested } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export enum typeOfCurrency {
  Sale = 'sales',
  Purchase = 'purchase',
}
export class CurrencyRate {
  @ApiProperty()
  date: Date;

  @ApiProperty()
  rate: number;

  @ApiProperty({ enum: ['sales', 'purchase'] })
  type: typeOfCurrency;
}
export class CreateCurrencyDto {
  @ApiProperty()
  name: string;

  latestRate: number;
  // @ApiProperty()
  // rate: number;

  @ApiProperty()
  symbol: string;

  @ApiProperty()
  currencySymbol: string;

  @ValidateNested({ each: true })
  @ApiProperty({ type: () => [CurrencyRate] })
  currencyRate: CurrencyRate[];
}
