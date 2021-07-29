import { IsNumber, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
export class CreateTaxDto {
  @ApiProperty()
  name: string;

  @ApiProperty()
  rate: number;

  @ApiProperty()
  account: any;
}
