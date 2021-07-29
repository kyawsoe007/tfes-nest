import { IsNumber, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
export class CreateDownPaymentDto {
  @ApiProperty()
  name: string;
  @ApiProperty()
  amount:number;
}
