import { ApiProperty } from '@nestjs/swagger';
export class CreateSkusDto {
  @ApiProperty()
  unitCost: number;

  @ApiProperty()
  quantity: number;

  @ApiProperty()
  location: string;

  @ApiProperty()
  remarks: string;

  @ApiProperty()
  product: string;

  @ApiProperty()
  supplierNo?: string;

  @ApiProperty({ type: () => [RsvdDto] })
  rsvd?: RsvdDto[];
}

export class RsvdDto {
  woId: string;
  woItemId: string;
  qty: number;
  set?: any;
  skuId?: string;
  _id?: string;
}
