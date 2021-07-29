import { ApiProperty } from '@nestjs/swagger';
export class CreateCreditTermDto {
  @ApiProperty()
  name: string;
  @ApiProperty()
  term: number;
}
