import { ApiProperty } from '@nestjs/swagger';
export class CreateCreditLimitDto {
  @ApiProperty()
  name: string;
  @ApiProperty()
  amount:number;
}
