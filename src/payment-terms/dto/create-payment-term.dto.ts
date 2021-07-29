import { IsInt } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePaymentTermDto {
  @ApiProperty()
  name: string;
  // @IsInt()
  @ApiProperty()
  days: number;
}
