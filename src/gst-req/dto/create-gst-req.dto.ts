import { ApiProperty } from '@nestjs/swagger';

export class CreateGstReqDto {
  @ApiProperty()
  name: string;
}
