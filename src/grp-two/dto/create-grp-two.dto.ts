import { ApiProperty } from '@nestjs/swagger';

export class CreateGrpTwoDto {
  @ApiProperty()
  name: string;
}
