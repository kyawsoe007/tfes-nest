import { ApiProperty } from '@nestjs/swagger';

export class CreateGrpOneDto {
  @ApiProperty()
  name: string;
}
