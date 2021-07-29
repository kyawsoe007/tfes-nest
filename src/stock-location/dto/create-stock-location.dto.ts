import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString } from 'class-validator';

export class CreateStockLocationDto {
  @ApiProperty()
  // @IsString({ message: 'must be string' })
  name: string;
  readonly address: string;
}
