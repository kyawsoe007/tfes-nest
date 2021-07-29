import { ApiProperty } from '@nestjs/swagger';

export class CreateIncotermDto {
  @ApiProperty()
  name: string;
}
