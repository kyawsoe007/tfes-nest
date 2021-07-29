import { ApiProperty } from '@nestjs/swagger';

export class CreateBomDto {
  @ApiProperty()
  productList: any;

  // @ApiProperty()
  // isCreated: boolean;
  description: string;

  @ApiProperty()
  _id: any;
}
