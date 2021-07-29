import { ApiProperty } from '@nestjs/swagger';

export class CreateUomDto {
  @ApiProperty()
  name: string;
}
